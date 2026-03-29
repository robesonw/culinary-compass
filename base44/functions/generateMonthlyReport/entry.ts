import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { format, startOfMonth, endOfMonth, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get month/year from query params or use current month
    const url = new URL(req.url);
    const monthStr = url.searchParams.get('month');
    const yearStr = url.searchParams.get('year');
    
    const now = new Date();
    const reportMonth = monthStr ? parseInt(monthStr) - 1 : now.getMonth();
    const reportYear = yearStr ? parseInt(yearStr) : now.getFullYear();
    
    const monthStart = startOfMonth(new Date(reportYear, reportMonth, 1));
    const monthEnd = endOfMonth(monthStart);

    // Fetch all required data in parallel
    const [progressEntries, nutritionLogs, labResults, userBadges, streakData, userPrefs] = await Promise.all([
      base44.entities.ProgressEntry.filter({ created_by: user.email }, '-entry_date').catch(() => []),
      base44.entities.NutritionLog.filter({ created_by: user.email }, '-log_date').catch(() => []),
      base44.entities.LabResult.filter({ created_by: user.email }, '-sync_date').catch(() => []),
      base44.entities.UserBadge.filter({ created_by: user.email }).catch(() => []),
      base44.entities.UserStreak.filter({ created_by: user.email }).then(s => s?.[0]).catch(() => ({})),
      base44.entities.UserPreferences.filter({ created_by: user.email }).then(p => p?.[0]).catch(() => ({}))
    ]);

    // Filter data for the month
    const monthProgress = progressEntries.filter(e => {
      const d = parseISO(e.entry_date);
      return d >= monthStart && d <= monthEnd;
    });

    const monthNutrition = nutritionLogs.filter(e => {
      const d = parseISO(e.log_date);
      return d >= monthStart && d <= monthEnd;
    });

    // Calculate nutrition stats
    const nutritionStats = calculateNutritionStats(monthNutrition);
    
    // Get weight change
    const weightChange = calculateWeightChange(monthProgress);
    
    // Get recent lab results (last 2 for comparison)
    const recentLabs = labResults.slice(0, 2);

    // Get badges earned this month
    const monthBadges = userBadges.filter(b => {
      if (!b.earned_date) return false;
      const d = parseISO(b.earned_date);
      return d >= monthStart && d <= monthEnd && b.is_earned;
    });

    // Generate PDF
    const pdf = new jsPDF();
    const monthName = format(monthStart, 'MMMM yyyy');
    
    addCoverPage(pdf, user, monthName);
    addLabResultsSection(pdf, recentLabs || []);
    addNutritionSection(pdf, nutritionStats, monthNutrition || []);
    addProgressSection(pdf, monthProgress || [], weightChange);
    addMealPlanAdherenceSection(pdf, streakData || {}, monthNutrition || []);
    addAchievementsSection(pdf, monthBadges || []);
    addGoalsSection(pdf, nutritionStats);

    // Convert PDF to blob and upload as private file
    const pdfBytes = pdf.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', blob, `VitaPlate_Report_${monthName.replace(' ', '_')}.pdf`);

    // For now, return the PDF directly as base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
    
    return Response.json({
      success: true,
      pdf: `data:application/pdf;base64,${base64}`,
      filename: `VitaPlate_Report_${monthName.replace(' ', '_')}.pdf`
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function addCoverPage(pdf, user, monthName) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  
  // Background
  pdf.setFillColor(79, 70, 229); // Indigo
  pdf.rect(0, 0, width, height / 2, 'F');
  
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, height / 2, width, height / 2, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(40);
  pdf.text('VitaPlate', width / 2, 40, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text('Monthly Health Report', width / 2, 55, { align: 'center' });

  // Month and User
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(20);
  pdf.text(monthName, width / 2, height / 2 + 30, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(user.full_name || user.email, width / 2, height / 2 + 50, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Report Generated: ${format(new Date(), 'MMM d, yyyy')}`, width / 2, height - 20, { align: 'center' });
}

function addLabResultsSection(pdf, labResults) {
  addNewPage(pdf, 'Lab Results Summary');
  
  if (labResults.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(120, 120, 120);
    pdf.text('No lab results recorded this month.', 20, 60);
    return;
  }

  const currentLab = labResults[0];
  const previousLab = labResults[1];

  let y = 60;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  const markers = [
    { label: 'Hemoglobin A1C', key: 'a1c', unit: '%', normal: [4, 6] },
    { label: 'Total Cholesterol', key: 'total_cholesterol', unit: 'mg/dL', normal: [0, 200] },
    { label: 'HDL Cholesterol', key: 'hdl_cholesterol', unit: 'mg/dL', normal: [40, 300] },
    { label: 'LDL Cholesterol', key: 'ldl_cholesterol', unit: 'mg/dL', normal: [0, 100] },
    { label: 'Triglycerides', key: 'triglycerides', unit: 'mg/dL', normal: [0, 150] }
  ];

  markers.forEach(marker => {
    const value = currentLab[marker.key];
    if (value) {
      const status = getHealthStatus(value, marker.normal);
      const statusEmoji = status === 'good' ? '🟢' : status === 'warning' ? '🟡' : '🔴';
      
      pdf.text(`${statusEmoji} ${marker.label}: ${value} ${marker.unit}`, 20, y);
      y += 8;
    }
  });
}

function addNutritionSection(pdf, stats, logs) {
  addNewPage(pdf, 'Nutrition Summary');
  
  let y = 60;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  pdf.text(`Days Tracked: ${stats.daysTracked}`, 20, y);
  y += 8;
  pdf.text(`Avg Daily Calories: ${stats.avgCalories.toFixed(0)} kcal`, 20, y);
  y += 8;
  pdf.text(`Avg Daily Protein: ${stats.avgProtein.toFixed(1)}g`, 20, y);
  y += 12;

  // Macros pie chart approximation
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Macro Breakdown:', 20, y);
  y += 6;

  const macroPercentages = {
    Protein: (stats.avgProtein * 4 / stats.avgCalories * 100).toFixed(0),
    Carbs: (stats.avgCarbs * 4 / stats.avgCalories * 100).toFixed(0),
    Fat: (stats.avgFat * 9 / stats.avgCalories * 100).toFixed(0)
  };

  Object.entries(macroPercentages).forEach(([macro, pct]) => {
    pdf.text(`  ${macro}: ${pct}%`, 25, y);
    y += 6;
  });

  // Top meals
  if (logs.length > 0) {
    y += 6;
    pdf.setFontSize(10);
    pdf.text('Most Logged Meals:', 20, y);
    y += 6;
    
    const topMeals = logs.slice(0, 5);
    topMeals.forEach(meal => {
      pdf.setFontSize(9);
      pdf.text(`  • ${meal.recipe_name} (${meal.calories} cal)`, 25, y);
      y += 5;
    });
  }
}

function addProgressSection(pdf, entries, weightChange) {
  addNewPage(pdf, 'Progress & Measurements');
  
  let y = 60;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  if (weightChange) {
    const direction = weightChange.loss ? 'Lost' : 'Gained';
    const emoji = weightChange.loss ? '📉' : '📈';
    pdf.text(`${emoji} Weight: ${direction} ${Math.abs(weightChange.change).toFixed(1)}${weightChange.unit}`, 20, y);
    y += 8;
  }

  if (entries.length > 0) {
    const latest = entries[0];
    
    if (latest.waist_cm) {
      pdf.text(`Waist: ${latest.waist_cm}cm`, 20, y);
      y += 6;
    }
    if (latest.body_fat_percentage) {
      pdf.text(`Body Fat: ${latest.body_fat_percentage}%`, 20, y);
      y += 6;
    }

    y += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Progress entries this month: ${entries.length}`, 20, y);
  }
}

function addMealPlanAdherenceSection(pdf, streakData = {}, logs) {
  addNewPage(pdf, 'Meal Plan Adherence');
  
  let y = 60;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  const daysInMonth = 30;
  const adherenceRate = logs.length > 0 ? Math.round((logs.length / (daysInMonth * 3)) * 100) : 0;

  pdf.text(`Current Streak: ${streakData?.meal_log_streak || 0} days 🔥`, 20, y);
  y += 8;
  pdf.text(`Longest Streak: ${streakData?.longest_streak || 0} days`, 20, y);
  y += 8;
  pdf.text(`Meals Logged: ${logs.length}`, 20, y);
  y += 8;
  pdf.text(`Adherence Rate: ${adherenceRate}%`, 20, y);
}

function addAchievementsSection(pdf, badges) {
  addNewPage(pdf, 'Achievements');
  
  if (badges.length === 0) {
    pdf.setFontSize(11);
    pdf.setTextColor(120, 120, 120);
    pdf.text('No badges earned this month yet. Keep up the great work!', 20, 60);
    return;
  }

  let y = 60;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);

  badges.forEach(badge => {
    pdf.text(`${badge.badge_emoji || '🏆'} ${badge.badge_name}`, 20, y);
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`${badge.description}`, 25, y + 5);
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    y += 14;
  });
}

function addGoalsSection(pdf, stats) {
  addNewPage(pdf, 'Goals for Next Month');
  
  let y = 60;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  const goals = [];
  
  if (stats.avgCalories > 2500) {
    goals.push('• Focus on portion control - aim for 500 calories less per day');
  } else if (stats.avgCalories < 1500) {
    goals.push('• Increase calorie intake to meet your energy needs');
  }

  if (stats.avgProtein < 80) {
    goals.push('• Increase daily protein intake - aim for 0.8g per pound of body weight');
  }

  if (stats.daysTracked < 25) {
    goals.push('• Log meals consistently - target 25+ days of tracking');
  } else {
    goals.push('• Continue consistent tracking - maintain your logging streak!');
  }

  goals.push('• Schedule next lab work for quarterly review');
  goals.push('• Stay hydrated - aim for 2-3 liters of water daily');

  goals.forEach(goal => {
    pdf.text(goal, 20, y);
    y += 8;
  });
}

function addNewPage(pdf, sectionTitle) {
  pdf.addPage();
  pdf.setFontSize(18);
  pdf.setTextColor(79, 70, 229);
  pdf.text(sectionTitle, 20, 20);
  
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(20, 28, 190, 28);
  pdf.setTextColor(0, 0, 0);
}

function calculateNutritionStats(logs) {
  if (logs.length === 0) {
    return {
      daysTracked: 0,
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0
    };
  }

  const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs || 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fat || 0), 0);

  const uniqueDays = new Set(logs.map(l => l.log_date)).size;

  return {
    daysTracked: uniqueDays,
    avgCalories: totalCalories / uniqueDays,
    avgProtein: totalProtein / uniqueDays,
    avgCarbs: totalCarbs / uniqueDays,
    avgFat: totalFat / uniqueDays
  };
}

function calculateWeightChange(entries) {
  if (entries.length < 2) return null;

  const sortedByDate = [...entries].sort((a, b) =>
    new Date(a.entry_date) - new Date(b.entry_date)
  );

  const first = sortedByDate[0];
  const last = sortedByDate[sortedByDate.length - 1];

  if (!first.weight || !last.weight) return null;

  return {
    change: last.weight - first.weight,
    loss: last.weight < first.weight,
    unit: first.weight_unit || 'kg'
  };
}

function getHealthStatus(value, normalRange) {
  if (value < normalRange[0] || value > normalRange[1]) {
    return 'bad';
  }
  if (value < normalRange[0] + 5 || value > normalRange[1] - 5) {
    return 'warning';
  }
  return 'good';
}
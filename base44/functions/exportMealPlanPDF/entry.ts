import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();
    if (!planId) {
      return Response.json({ error: 'planId is required' }, { status: 400 });
    }

    const plan = await base44.entities.MealPlan.get(planId);
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = 20;

    const addText = (text, x, fontSize = 11, bold = false, color = [30, 30, 30]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.text(text, x, y);
    };

    const checkPage = (needed = 10) => {
      if (y + needed > 280) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VitaPlate', margin, 12);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text(plan.name || 'Meal Plan', margin, 22);
    y = 36;

    // Meta info
    addText(`Diet: ${(plan.diet_type || '').replace(/-/g, ' ')}  |  Days: ${plan.days?.length || 0}  |  Generated: ${new Date().toLocaleDateString()}`, margin, 9, false, [100, 100, 100]);
    y += 10;

    // Macros summary
    if (plan.macros) {
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(`Avg Daily Macros:  Protein ${plan.macros.protein || 0}g   Carbs ${plan.macros.carbs || 0}g   Fat ${plan.macros.fat || 0}g`, margin + 4, y + 10);
      y += 24;
    }

    // Days
    for (const day of (plan.days || [])) {
      checkPage(20);

      // Day header
      doc.setFillColor(224, 231, 255);
      doc.rect(margin, y, contentW, 9, 'F');
      addText(day.day || 'Day', margin + 2, 11, true, [55, 48, 163]);
      y += 14;

      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks']) {
        const meal = day[mealType];
        if (!meal?.name) continue;
        checkPage(22);

        addText(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`, margin + 2, 9, true, [99, 102, 241]);
        y += 5;
        addText(meal.name, margin + 4, 10, false, [30, 30, 30]);
        y += 5;

        const macroLine = [
          meal.calories ? `${meal.calories} kcal` : '',
          meal.protein ? `Protein: ${meal.protein}g` : '',
          meal.carbs ? `Carbs: ${meal.carbs}g` : '',
          meal.fat ? `Fat: ${meal.fat}g` : '',
          meal.prepTime ? `Prep: ${meal.prepTime}` : ''
        ].filter(Boolean).join('  ·  ');

        if (macroLine) {
          addText(macroLine, margin + 4, 8, false, [120, 120, 120]);
          y += 4;
        }

        if (meal.healthBenefit) {
          const wrapped = doc.splitTextToSize(`✓ ${meal.healthBenefit}`, contentW - 8);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(16, 130, 70);
          doc.text(wrapped, margin + 4, y);
          y += wrapped.length * 4;
        }
        y += 3;
      }
      y += 4;
    }

    // Grocery List
    if (plan.grocery_list && Object.keys(plan.grocery_list).length > 0) {
      checkPage(20);
      doc.addPage();
      y = 20;

      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 210, 14, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Grocery List', margin, 10);
      y = 24;

      if (plan.estimated_cost) {
        addText(`Estimated Weekly Cost: $${plan.estimated_cost.toFixed(2)}`, margin, 9, false, [100, 100, 100]);
        y += 8;
      }

      for (const [category, items] of Object.entries(plan.grocery_list)) {
        if (!items || items.length === 0) continue;
        checkPage(14);

        addText(category, margin, 10, true, [55, 48, 163]);
        y += 6;

        for (const item of items) {
          checkPage(7);
          const priceStr = item.price ? ` — $${(item.price * (item.quantity || 1)).toFixed(2)}` : '';
          const qtyStr = item.quantity && item.quantity !== 1 ? ` x${item.quantity}` : '';
          addText(`□  ${item.name}${qtyStr}${priceStr}`, margin + 4, 9, false, [50, 50, 50]);
          y += 5;
        }
        y += 3;
      }
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text(`VitaPlate · ${plan.name} · Page ${i} of ${pageCount}`, margin, 292);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${plan.name || 'meal-plan'}.pdf"`,
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
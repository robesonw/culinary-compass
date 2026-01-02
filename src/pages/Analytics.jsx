import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Flame, Target } from 'lucide-react';

export default function Analytics() {
  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list(),
  });

  // Calculate accurate diet distribution
  const dietDistribution = React.useMemo(() => {
    return mealPlans.reduce((acc, plan) => {
      const type = plan.diet_type || 'custom';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }, [mealPlans]);

  const pieData = Object.entries(dietDistribution).map(([name, value]) => ({
    name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  // Calculate actual weekly trend based on creation dates
  const weeklyData = React.useMemo(() => {
    const weeks = {};
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    mealPlans.forEach(plan => {
      const planDate = new Date(plan.created_date).getTime();
      const weeksAgo = Math.floor((now - planDate) / weekMs);
      const weekLabel = weeksAgo === 0 ? 'This Week' : 
                       weeksAgo === 1 ? 'Last Week' :
                       weeksAgo <= 4 ? `${weeksAgo} Weeks Ago` : 'Earlier';
      
      if (weeksAgo <= 4) {
        weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
      }
    });
    
    const labels = ['4 Weeks Ago', '3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'This Week'];
    return labels.map(label => ({
      week: label,
      plans: weeks[label] || 0
    }));
  }, [mealPlans]);

  // Calculate actual average calories by diet type
  const calorieData = React.useMemo(() => {
    const dietCalories = {};
    const dietCounts = {};
    
    mealPlans.forEach(plan => {
      const dietType = plan.diet_type || 'custom';
      let planCalories = 0;
      let mealCount = 0;
      
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) {
              planCalories += parseInt(match[1]);
              mealCount++;
            }
          }
        });
      });
      
      if (mealCount > 0) {
        const avgPerDay = planCalories / (plan.days?.length || 1);
        dietCalories[dietType] = (dietCalories[dietType] || 0) + avgPerDay;
        dietCounts[dietType] = (dietCounts[dietType] || 0) + 1;
      }
    });
    
    return Object.entries(dietCalories).map(([diet, total]) => ({
      diet: diet.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      avg: Math.round(total / dietCounts[diet])
    }));
  }, [mealPlans]);

  const totalMeals = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0) * 4, 0);
  
  const avgCalories = React.useMemo(() => {
    if (mealPlans.length === 0) return 0;
    
    let totalCals = 0;
    let dayCount = 0;
    
    mealPlans.forEach(plan => {
      plan.days?.forEach(day => {
        let dayCals = 0;
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) {
              dayCals += parseInt(match[1]);
            }
          }
        });
        if (dayCals > 0) {
          totalCals += dayCals;
          dayCount++;
        }
      });
    });
    
    return dayCount > 0 ? Math.round(totalCals / dayCount) : 0;
  }, [mealPlans]);

  const totalDaysPlanned = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0), 0);

  const stats = [
    { title: 'Total Plans Created', value: mealPlans.length, icon: Calendar, color: 'indigo' },
    { title: 'Total Meals', value: totalMeals, icon: Target, color: 'emerald' },
    { title: 'Avg Calories/Day', value: avgCalories > 0 ? avgCalories.toLocaleString() : 'N/A', icon: Flame, color: 'orange' },
    { title: 'Days Planned', value: totalDaysPlanned, icon: TrendingUp, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-600 mt-1">
          Track your nutrition planning progress and trends
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
          };
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Diet Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Diet Type Distribution</CardTitle>
              <CardDescription>Breakdown of your meal plans by diet type</CardDescription>
            </CardHeader>
            <CardContent>
{pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>No meal plans created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Planning Activity</CardTitle>
              <CardDescription>Number of meal plans created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="plans" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Calories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Average Daily Calories by Diet Type</CardTitle>
              <CardDescription>Compare calorie intake across different diet types</CardDescription>
            </CardHeader>
            <CardContent>
{calorieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={calorieData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="diet" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  <p>Create meal plans to see calorie analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {pieData.length > 0 && (
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-2">Most Popular Diet</h4>
                  <p className="text-sm text-indigo-700">
                    {pieData.reduce((max, item) => item.value > max.value ? item : max).name} is your most frequently planned diet type with {pieData.reduce((max, item) => item.value > max.value ? item : max).value} plans
                  </p>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 mb-2">Planning Activity</h4>
                <p className="text-sm text-emerald-700">
                  {mealPlans.length > 0 ? `You've created ${mealPlans.length} meal plan${mealPlans.length === 1 ? '' : 's'} with ${totalMeals} total meals. Keep up the great work!` : 'Start creating meal plans to track your progress'}
                </p>
              </div>
              
              {avgCalories > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2">Nutritional Balance</h4>
                  <p className="text-sm text-amber-700">
                    Your average daily intake is {avgCalories} calories, {avgCalories >= 1800 && avgCalories <= 2200 ? 'well-balanced for most adults' : avgCalories < 1800 ? 'on the lower side - ensure adequate nutrition' : 'on the higher side - monitor your goals'}
                  </p>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-2">Variety</h4>
                <p className="text-sm text-purple-700">
                  You're exploring {Object.keys(dietDistribution).length} different diet type{Object.keys(dietDistribution).length === 1 ? '' : 's'}. Great way to find what works best for you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
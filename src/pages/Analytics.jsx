import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Flame, DollarSign } from 'lucide-react';

export default function Analytics() {
  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  const totalPlans = mealPlans.length;
  const totalMeals = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0) * 4, 0);
  const totalDays = mealPlans.reduce((sum, p) => sum + (p.days?.length || 0), 0);

  const avgCalories = React.useMemo(() => {
    if (mealPlans.length === 0) return 0;
    let totalCals = 0;
    let dayCount = 0;
    mealPlans.forEach(plan => {
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) {
              totalCals += parseInt(match[1]);
              dayCount++;
            }
          }
        });
      });
    });
    return dayCount > 0 ? Math.round(totalCals / (mealPlans.reduce((sum, p) => sum + (p.days?.length || 0), 0) || 1)) : 0;
  }, [mealPlans]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <p className="text-slate-600 mt-1">Track your nutrition journey</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Plans</p>
                <p className="text-3xl font-bold">{totalPlans}</p>
              </div>
              <Calendar className="w-10 h-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Meals</p>
                <p className="text-3xl font-bold">{totalMeals}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Calories/Day</p>
                <p className="text-3xl font-bold">{avgCalories}</p>
              </div>
              <Flame className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Days Planned</p>
                <p className="text-3xl font-bold">{totalDays}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
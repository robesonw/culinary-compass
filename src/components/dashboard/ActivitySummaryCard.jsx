import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Flame, Heart, Moon, Footprints } from 'lucide-react';

export default function ActivitySummaryCard({ todayActivity = null }) {
  if (!todayActivity) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No activity data synced yet. Sync from Apple Health to see your stats.</p>
        </CardContent>
      </Card>
    );
  }

  const adjustedCalories = todayActivity.active_calories 
    ? Math.round(todayActivity.active_calories * 0.8)
    : 0;

  const stats = [
    {
      icon: Footprints,
      label: 'Steps',
      value: todayActivity.steps ? todayActivity.steps.toLocaleString() : '—',
      color: 'blue'
    },
    {
      icon: Flame,
      label: 'Active Calories',
      value: todayActivity.active_calories ? todayActivity.active_calories.toLocaleString() : '—',
      color: 'orange',
      adjustment: adjustedCalories > 0 ? `+${adjustedCalories} added to meals` : null
    },
    {
      icon: Heart,
      label: 'Resting HR',
      value: todayActivity.resting_heart_rate ? `${todayActivity.resting_heart_rate} bpm` : '—',
      color: 'rose'
    },
    {
      icon: Moon,
      label: 'Sleep',
      value: todayActivity.sleep_hours ? `${todayActivity.sleep_hours}h` : '—',
      color: 'indigo'
    }
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Activity
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            Synced
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const bgColor = colorMap[stat.color];

            return (
              <div key={idx} className={`p-3 rounded-lg border ${bgColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">{stat.label}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                {stat.adjustment && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">{stat.adjustment}</p>
                )}
              </div>
            );
          })}
        </div>

        {adjustedCalories > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-900 mb-1">🎯 Activity Adjustment</p>
            <p className="text-xs text-emerald-700">
              You burned <strong>{todayActivity.active_calories}</strong> active calories. We've added a <strong>recovery snack (+{adjustedCalories} kcal)</strong> to your meal plan.
            </p>
          </div>
        )}

        {todayActivity.sleep_quality && (
          <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600">Sleep Quality: <span className="font-semibold text-slate-900 capitalize">{todayActivity.sleep_quality}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
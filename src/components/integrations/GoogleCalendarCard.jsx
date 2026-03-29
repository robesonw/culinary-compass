import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

export default function GoogleCalendarCard() {
  return (
    <Card className="opacity-75">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Sync meal plans to your calendar</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coming Soon</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Sync your meal plans as calendar events with prep times, ingredients, and reminders.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Features:</p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            <li>Auto-schedule meals at customizable times</li>
            <li>Color-coded events by meal type</li>
            <li>Includes ingredients and prep instructions</li>
            <li>15-minute reminders for each meal</li>
            <li>Weekly meal prep reminder</li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900">
            ⏳ This feature is being set up. You'll be able to connect your Google Calendar soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Apple, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AppleHealthCard({ lastSync = null, onSyncComplete = () => {} }) {
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({
    steps: '',
    active_calories: '',
    sleep_hours: '',
    resting_heart_rate: '',
    body_weight: '',
    sleep_quality: 'good',
    notes: ''
  });

  const handleAppleHealthConnect = async () => {
    setIsSyncing(true);
    try {
      // For web implementation, show instructions
      toast.info('📱 Open Health app on your iPhone → Health Data → Export → Share with VitaPlate', { duration: 5000 });
      // In production, this would integrate with Apple HealthKit API via a backend service
    } catch (error) {
      toast.error('Apple Health connection failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!formData.steps && !formData.active_calories) {
      toast.error('Please enter at least steps or calories');
      return;
    }

    setIsSyncing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const syncData = {
        sync_date: today,
        source: 'manual',
        steps: formData.steps ? parseInt(formData.steps) : null,
        active_calories: formData.active_calories ? parseInt(formData.active_calories) : null,
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
        resting_heart_rate: formData.resting_heart_rate ? parseInt(formData.resting_heart_rate) : null,
        body_weight: formData.body_weight ? parseFloat(formData.body_weight) : null,
        sleep_quality: formData.sleep_quality,
        notes: formData.notes || null
      };

      await base44.entities.WearableSync.create(syncData);
      
      toast.success('Activity data synced successfully!');
      setFormData({
        steps: '',
        active_calories: '',
        sleep_hours: '',
        resting_heart_rate: '',
        body_weight: '',
        sleep_quality: 'good',
        notes: ''
      });
      setIsManualEntry(false);
      onSyncComplete();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync activity data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-slate-900">Apple Health</CardTitle>
              <p className="text-xs text-slate-600 mt-1">Sync activity, sleep & weight</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600">Last sync</p>
            <p className="font-semibold text-slate-900">
              {new Date(lastSync).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        )}

        {!isManualEntry ? (
          <div className="space-y-3">
            <Button 
              onClick={handleAppleHealthConnect}
              disabled={isSyncing}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Apple className="w-4 h-4 mr-2" />
                  Connect Apple Health
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsManualEntry(true)}
              variant="outline"
              className="w-full"
            >
              Or enter data manually
            </Button>

            <p className="text-xs text-slate-600 p-2 rounded bg-blue-50 border border-blue-200">
              💡 <span className="font-medium">How it works:</span> Once connected, your daily steps, active calories, sleep, and heart rate automatically adjust your meal plan calorie targets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Steps</Label>
                <Input
                  type="number"
                  placeholder="e.g., 8500"
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Active Calories</Label>
                <Input
                  type="number"
                  placeholder="e.g., 420"
                  value={formData.active_calories}
                  onChange={(e) => setFormData({ ...formData, active_calories: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sleep (hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 7.5"
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Resting HR (bpm)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 62"
                  value={formData.resting_heart_rate}
                  onChange={(e) => setFormData({ ...formData, resting_heart_rate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Body Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                value={formData.body_weight}
                onChange={(e) => setFormData({ ...formData, body_weight: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Sleep Quality</Label>
              <select
                value={formData.sleep_quality}
                onChange={(e) => setFormData({ ...formData, sleep_quality: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg"
              >
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="e.g., Felt tired today, skipped workout"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 min-h-16 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleManualSubmit}
                disabled={isSyncing}
                className="flex-1"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Save & Sync
              </Button>
              <Button
                onClick={() => setIsManualEntry(false)}
                variant="outline"
                disabled={isSyncing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
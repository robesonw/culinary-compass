import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppleHealthCard from '@/components/integrations/AppleHealthCard';
import OuraRingCard from '@/components/integrations/OuraRingCard';
import WHOOPCard from '@/components/integrations/WHOOPCard';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch latest wearable sync
  const { data: latestSync, refetch: refetchSync } = useQuery({
    queryKey: ['latestWearableSync'],
    queryFn: async () => {
      const results = await base44.entities.WearableSync.list('-sync_date', 1);
      return results?.[0] || null;
    },
  });

  const handleSyncRefresh = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync - in production would call Apple HealthKit API
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchSync();
      toast.success('Activity data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600 mt-1">
          Connect health apps and devices to sync your data and get personalized meal recommendations
        </p>
      </div>

      {/* Apple Health Integration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Health & Wearables</h2>
          <Button
            onClick={handleSyncRefresh}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <AppleHealthCard 
          lastSync={latestSync?.created_date}
          onSyncComplete={() => refetchSync()}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <OuraRingCard 
            lastSync={latestSync?.wearable_source === 'oura' ? latestSync?.created_date : null}
            onSyncComplete={() => refetchSync()}
          />
          <WHOOPCard 
            lastSync={latestSync?.wearable_source === 'whoop' ? latestSync?.created_date : null}
            onSyncComplete={() => refetchSync()}
          />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Coming Soon</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: 'Fitbit', icon: '⌚', status: 'In Development' },
            { name: 'Google Fit', icon: '🔄', status: 'Planned' },
            { name: 'Garmin Connect', icon: '🗺️', status: 'Planned' },
          ].map(integration => (
            <Card key={integration.name} className="border-slate-200 opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{integration.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{integration.name}</p>
                      <p className="text-xs text-slate-600">Sync activity & health</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-slate-600">
                    {integration.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Privacy */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm">🔒 Data Privacy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            Your health data is securely stored and encrypted. We only use your activity data to personalize your meal plans.
          </p>
          <p>
            You can disconnect any integration and delete your synced data at any time in the Integrations settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
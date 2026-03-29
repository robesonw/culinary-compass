import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SupplementCard from '@/components/supplements/SupplementCard';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplementRecommendations() {
  const [searchParams] = useSearchParams();
  const labResultId = searchParams.get('labResultId');
  const [recommendations, setRecommendations] = useState(null);
  const [topPriority, setTopPriority] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user subscription status
  const { data: userSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => base44.entities.UserSettings.filter({ user_id: '' }, '', 1).then(res => res[0]),
  });

  // Get lab result
  const { data: labResult } = useQuery({
    queryKey: ['labResult', labResultId],
    queryFn: () => labResultId ? base44.entities.LabResult.filter({ id: labResultId }, '', 1).then(res => res[0]) : null,
    enabled: !!labResultId,
  });

  // Generate recommendations
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!labResultId) {
        setError('No lab result selected');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await base44.functions.invoke('generateSupplementRecommendations', {
          labResultId
        });

        if (response.data.success) {
          setRecommendations(response.data.recommendations);
          setTopPriority(response.data.topPriority);
        } else {
          setError('Failed to generate recommendations');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Failed to generate recommendations');
        toast.error('Failed to generate recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    generateRecommendations();
  }, [labResultId]);

  // Determine if user can see all recommendations
  const isPremium = userSettings?.subscription_plan === 'premium' || userSettings?.subscription_plan === 'pro';
  const visibleRecommendations = isPremium 
    ? recommendations 
    : recommendations?.slice(0, 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600">Analyzing lab results...</p>
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Link to="/LabResults">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lab Results
          </Button>
        </Link>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Unable to Generate Recommendations</h3>
                <p className="text-sm text-red-800">{error || 'Please try again or contact support'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Supplement Recommendations</h1>
          <p className="text-slate-600 mt-1">
            Based on your lab results from {labResult?.upload_date ? new Date(labResult.upload_date).toLocaleDateString() : 'recent test'}
          </p>
        </div>
        <Link to="/LabResults">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ Important Disclaimer</p>
              <p>These are general suggestions based on your lab values. <strong>Always consult your doctor</strong> before starting any supplement regimen, especially if you're on medications or have health conditions.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Priority Section */}
      {topPriority.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Top {topPriority.length} Priority Supplements</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {topPriority.map((supplement) => (
              <SupplementCard
                key={supplement.name}
                supplement={supplement}
                labResultId={labResultId}
                isPriority={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Recommendations or Upsell */}
      {!isPremium && recommendations && recommendations.length > 1 ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Additional Recommendations</h2>
          
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-indigo-900">🔒 Unlock All Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-indigo-800">
                You're viewing <strong>1 of {recommendations.length}</strong> recommendations. Upgrade to Pro or Premium to see all personalized suggestions based on your complete lab profile.
              </p>
              <div className="space-y-2 text-sm text-indigo-800 ml-3 list-disc">
                <p>✓ See all {recommendations.length} supplement recommendations</p>
                <p>✓ Get detailed health insights from advanced lab analysis</p>
                <p>✓ Track supplement effectiveness with follow-up testing</p>
              </div>
              <Link to="/Pricing" className="block">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  Upgrade to Pro
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">All Recommendations</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {visibleRecommendations?.map((supplement) => (
              <SupplementCard
                key={supplement.name}
                supplement={supplement}
                labResultId={labResultId}
                isPriority={topPriority.some(p => p.name === supplement.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-slate-900">📋 How to Use These Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="space-y-2 text-sm text-slate-700 list-decimal ml-5">
            <li><strong>Consult Your Doctor</strong> - Share these recommendations with your healthcare provider</li>
            <li><strong>Start Slowly</strong> - Introduce one supplement at a time to monitor for effects</li>
            <li><strong>Check Interactions</strong> - Verify that supplements won't interact with medications</li>
            <li><strong>Track Results</strong> - Retest after 8-12 weeks to see improvements</li>
            <li><strong>Quality Matters</strong> - Look for third-party testing (USP, NSF, ConsumerLab)</li>
          </ol>
        </CardContent>
      </Card>

      {/* Quality Tips */}
      <Card className="border-slate-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Pro Tips for Supplement Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800 ml-3 list-disc">
            <li><strong>Look for third-party testing</strong> - USP, NSF, or ConsumerLab verified</li>
            <li><strong>Check the form</strong> - Glycinate, Picolinate, and Methylated forms are more bioavailable</li>
            <li><strong>Avoid unnecessary fillers</strong> - Fewer additives is usually better</li>
            <li><strong>Storage matters</strong> - Keep supplements away from heat and moisture</li>
            <li><strong>Timing is important</strong> - Fat-soluble vitamins (D, K) are best with meals</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-6 border-t border-slate-200">
        <p className="text-xs text-slate-600 mb-3">
          💰 We may earn a small affiliate commission on Amazon purchases at no extra cost to you. This helps us keep VitaPlate free and developing.
        </p>
        <Link to="/LabResults">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lab Results
          </Button>
        </Link>
      </div>
    </div>
  );
}
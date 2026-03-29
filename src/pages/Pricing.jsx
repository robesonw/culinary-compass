import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Zap, Crown, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Leaf,
    color: 'slate',
    description: 'Perfect to get started',
    priceId: null,
    features: [
      '1 meal plan per month',
      'Basic nutrition tracking',
      'Community recipes access',
      'Forum access',
    ],
    limitations: [
      'No lab result analysis',
      'No AI recipe generation',
      'No grocery price lookup',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    icon: Zap,
    color: 'indigo',
    description: 'For serious nutrition tracking',
    priceId: 'price_1TGB0B2fkJjbFUOaMdWx6fIM',
    popular: true,
    features: [
      'Unlimited meal plans',
      'Lab result AI analysis',
      'AI Recipe Generator',
      'Grocery price lookup',
      'Advanced nutrition tracking',
      'Micronutrient tracking',
      'Share & community features',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    icon: Crown,
    color: 'purple',
    description: 'For complete health optimization',
    priceId: 'price_1TGB0B2fkJjbFUOaY7OGXV9D',
    features: [
      'Everything in Pro',
      'Meal swap suggestions',
      'Grocery affiliate links',
      'Priority AI generation',
      'Advanced analytics',
      'White-glove onboarding',
      'Export meal plans to PDF',
    ],
  },
];

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') return;
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    // Block checkout inside iframe (must be used from published app)
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app. Please open the app in a new tab.');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan_id: plan.id,
      });
      if (response?.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Handle success/cancel redirects
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success(`Successfully subscribed to ${params.get('plan')} plan! Your 7-day trial has started.`);
    } else if (params.get('cancelled') === 'true') {
      toast.info('Checkout cancelled.');
    }
  }, []);

  const currentPlan = user?.subscription_plan || 'free';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
        <p className="text-slate-500 mt-2">Start free, upgrade when you're ready</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const isPro = plan.id === 'pro';
          const isPremium = plan.id === 'premium';

          return (
            <Card
              key={plan.id}
              className={`relative border-2 transition-all ${
                plan.popular
                  ? 'border-indigo-500 shadow-xl shadow-indigo-100 scale-105'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  plan.id === 'free' ? 'bg-slate-100' :
                  plan.id === 'pro' ? 'bg-indigo-100' : 'bg-purple-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    plan.id === 'free' ? 'text-slate-600' :
                    plan.id === 'pro' ? 'text-indigo-600' : 'text-purple-600'
                  }`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-slate-500 text-sm">{plan.description}</p>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 text-sm">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.id === 'free' ? 'text-slate-500' :
                        plan.id === 'pro' ? 'text-indigo-600' : 'text-purple-600'
                      }`} />
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((l, i) => (
                    <li key={`lim-${i}`} className="flex items-start gap-2 text-sm opacity-50">
                      <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">✗</span>
                      <span className="text-slate-500">{l}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan || loadingPlan === plan.id}
                  className={`w-full ${
                    plan.id === 'free' ? 'bg-slate-800 hover:bg-slate-900' :
                    plan.id === 'pro' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800' :
                    'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  } text-white`}
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Get Started Free'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-slate-500">
        <p>All paid plans include a 7-day free trial. Cancel anytime.</p>
        <p className="mt-1">Secure payments powered by Stripe 🔒</p>
      </div>
    </div>
  );
}
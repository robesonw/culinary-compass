import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export function useSubscription() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const results = await base44.entities.UserSettings.list();
      return results[0] || { subscription_plan: 'free', subscription_status: 'inactive' };
    },
  });

  const plan = settings?.subscription_plan || 'free';
  const status = settings?.subscription_status || 'inactive';
  const isActive = status === 'active' || status === 'trialing';

  return {
    plan,
    status,
    isActive,
    isPro: isActive && (plan === 'pro' || plan === 'premium'),
    isPremium: isActive && plan === 'premium',
    isFree: plan === 'free' || !isActive,
    isLoading,
    settings,
  };
}

// Hook to gate paywalled features — redirects to /Pricing if not on a paid plan
export function useRequiresPro() {
  const navigate = useNavigate();
  const sub = useSubscription();

  function requiresPro() {
    if (!sub.isLoading && sub.isFree) {
      navigate('/Pricing');
      return false;
    }
    return true;
  }

  return { ...sub, requiresPro };
}
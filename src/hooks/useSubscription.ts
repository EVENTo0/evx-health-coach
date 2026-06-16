import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getSubscriptionStatus } from '../services/subscription';

export function useSubscription() {
  const { subscription, setSubscription } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptionStatus()
      .then((status) => setSubscription(status))
      .finally(() => setLoading(false));
  }, []);

  return {
    isPremium: subscription?.isPremium === true,
    plan: subscription?.plan ?? 'free',
    isOnTrial: subscription?.isOnTrial ?? false,
    expiresAt: subscription?.expiresAt ?? null,
    loading,
  };
}

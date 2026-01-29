import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Subscription } from '../types/subscription';

interface SubscriptionState {
  isSubscribed: boolean;
  subscription: Subscription | null;
  loading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSubscribed(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'subscriptions', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Subscription;
          setSubscription(data);
          
          // Verificar si está activa y no expirada
          const now = new Date();
          const expiresAt = data.expiresAt?.toDate?.() || new Date(0);
          setIsSubscribed(data.status === 'active' && expiresAt > now);
        } else {
          setSubscription(null);
          setIsSubscribed(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscription:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { isSubscribed, subscription, loading };
}
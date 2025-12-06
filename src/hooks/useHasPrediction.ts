import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useHasPrediction() {
  const [hasPrediction, setHasPrediction] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const pollaRef = doc(db, 'polla_completa', user.uid);
          const pollaSnap = await getDoc(pollaRef);
          setHasPrediction(pollaSnap.exists());
        } catch (error) {
          console.error('Error checking prediction:', error);
          setHasPrediction(false);
        }
      } else {
        setHasPrediction(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { hasPrediction, loading };
}
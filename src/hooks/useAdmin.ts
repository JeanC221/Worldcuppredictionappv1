import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const adminDoc = await getDoc(doc(db, 'config', 'admins'));
          
          if (adminDoc.exists()) {
            const adminEmails: string[] = adminDoc.data().emails || [];
            setIsAdmin(adminEmails.includes(user.email));
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error verificando admin:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, loading };
}
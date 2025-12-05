import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('=== DEBUG ADMIN ===');
      console.log('Usuario actual:', user);
      console.log('Email del usuario:', user?.email);
      
      if (user && user.email) {
        try {
          const adminDoc = await getDoc(doc(db, 'config', 'admins'));
          
          console.log('Documento admins existe:', adminDoc.exists());
          console.log('Datos del documento:', adminDoc.data());
          
          if (adminDoc.exists()) {
            const adminEmails: string[] = adminDoc.data().emails || [];
            console.log('Lista de emails admin:', adminEmails);
            console.log('¿Email está en lista?:', adminEmails.includes(user.email));
            
            setIsAdmin(adminEmails.includes(user.email));
          } else {
            console.log('El documento config/admins NO existe');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error verificando admin:', error);
          setIsAdmin(false);
        }
      } else {
        console.log('No hay usuario logueado o no tiene email');
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, loading };
}
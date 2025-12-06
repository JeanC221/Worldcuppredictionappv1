import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  type: 'new_participant' | 'match_result' | 'rank_change' | 'exact_match' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  data?: {
    matchId?: string;
    participantName?: string;
    oldRank?: number;
    newRank?: number;
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    
    try {
      const batch = writeBatch(db);
      notifications
        .filter(n => !n.read)
        .forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
}

// Función helper para crear notificaciones 
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Notification['data']
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
      data: data || null
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Función para notificar a todos los usuarios 
export async function broadcastNotification(
  userIds: string[],
  type: Notification['type'],
  title: string,
  message: string,
  data?: Notification['data']
) {
  try {
    const batch = writeBatch(db);
    
    for (const userId of userIds) {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: Timestamp.now(),
        data: data || null
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
  }
}
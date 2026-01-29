import { Timestamp } from 'firebase/firestore';

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled';

export type PaymentMethod = 'nequi' | 'daviplata' | 'bancolombia';

export interface Subscription {
  userId: string;
  status: SubscriptionStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amount: number;
  currency: string;
  paidAt: Timestamp;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentIntent {
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface SubscriptionCheck {
  isSubscribed: boolean;
  subscription?: Subscription;
}
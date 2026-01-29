/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

// Definir secrets para Stripe
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

setGlobalOptions({ maxInstances: 10 });

// Interfaces para los datos
interface CheckoutData {
  currency: string;
  amount: number;
  returnUrl: string;
  userEmail: string;
}

interface VerifyPaymentData {
  sessionId: string;
}

export const createStripeCheckout = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const data = request.data as CheckoutData;

    try {
      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      });
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: 'Inscripcion Mundial 2026',
                description: 'Acceso completo a la plataforma de predicciones',
              },
              unit_amount: data.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${data.returnUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.returnUrl}/checkout`,
        client_reference_id: request.auth.uid,
        customer_email: data.userEmail,
        metadata: {
          userId: request.auth.uid,
        },
      });

      return { sessionId: session.id };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new HttpsError('internal', 'Error al crear sesion de pago');
    }
  }
);

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    });
    
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send('Webhook Error');
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);

        await admin.firestore().collection('subscriptions').doc(userId).set({
          userId,
          status: 'active',
          paymentMethod: 'stripe',
          transactionId: session.id,
          amount: session.amount_total || 0,
          currency: session.currency || 'cop',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.json({ received: true });
  }
);

export const payuWebhook = onRequest(async (req, res) => {
  try {
    const {
      reference_sale,
      state_pol,
      value,
      currency,
      buyer_email,
    } = req.body;

    if (state_pol === '4') {
      const userQuery = await admin.firestore()
        .collection('users')
        .where('email', '==', buyer_email)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        const userId = userQuery.docs[0].id;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);

        await admin.firestore().collection('subscriptions').doc(userId).set({
          userId,
          status: 'active',
          paymentMethod: 'payu',
          transactionId: reference_sale,
          amount: parseFloat(value),
          currency: currency.toLowerCase(),
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayU webhook error:', error);
    res.status(500).send('Error');
  }
});

export const verifyStripePayment = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const data = request.data as VerifyPaymentData;

    try {
      const stripe = new Stripe(stripeSecretKey.value(), {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      });
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      return { paid: session.payment_status === 'paid' };
    } catch (error) {
      console.error('Stripe verification error:', error);
      throw new HttpsError('internal', 'Error al verificar pago');
    }
  }
);

export const verifyPayUPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  try {
    const subscriptionDoc = await admin.firestore()
      .collection('subscriptions')
      .doc(request.auth.uid)
      .get();

    if (!subscriptionDoc.exists) {
      return { paid: false };
    }

    const subscription = subscriptionDoc.data();
    return {
      paid: subscription?.status === 'active',
    };
  } catch (error) {
    console.error('PayU verification error:', error);
    throw new HttpsError('internal', 'Error al verificar pago');
  }
});

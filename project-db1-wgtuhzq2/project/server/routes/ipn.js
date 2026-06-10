/**
 * Gestionnaire IPN (Instant Payment Notification) pour SenePay
 * 
 * Ce fichier gère les notifications de paiement instantanées envoyées par SenePay
 * lorsqu'un paiement est confirmé.
 */

import crypto from 'crypto';
import express from 'express';
import admin from 'firebase-admin';
import sseService from '../services/sseService.js';

const router = express.Router();

/**
 * Vérifie la signature HMAC-SHA256 de SenePay
 * @param {Buffer} rawBody - Le corps brut de la requête
 * @param {string} signature - La signature reçue dans le header X-SenePay-Signature
 * @param {string} secret - Le SENEPAY_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifySenePaySignature(rawBody, signature, secret) {
  try {
    if (!rawBody) {
      console.error('[SenePay IPN] Corps brut manquant');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Comparaison sécurisée contre les attaques temporelles
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[SenePay IPN] Erreur de vérification signature:', error);
    return false;
  }
}

/**
 * Endpoint principal pour recevoir les notifications IPN de SenePay
 */
router.post('/senepay-ipn', async (req, res) => {
  const timestamp = new Date().toISOString();
  const signature = req.headers['x-senepay-signature'];
  const webhookSecret = process.env.SENEPAY_WEBHOOK_SECRET;

  console.log(`[SenePay IPN] ${timestamp} - Notification reçue`);

  // 1. Réponse rapide à SenePay (Accusé de réception)
  if (!signature || !webhookSecret || !verifySenePaySignature(req.rawBody, signature, webhookSecret)) {
    console.error('[SenePay IPN] Signature invalide ou configuration manquante');
    return res.status(401).send('Invalid signature');
  }

  // Signature valide, on répond 200 immédiatement pour libérer SenePay
  res.status(200).send('OK');

  console.log('[SenePay IPN] Payload reçu:', JSON.stringify(req.body));

  // 2. Traitement asynchrone (en arrière-plan)
  // SenePay peut varier les noms des champs (camelCase vs snake_case)
  const orderReference = req.body.orderReference || req.body.orderId || req.body.order_id || req.body.externalId || req.body.external_id;
  const status = req.body.status;
  const transactionId = req.body.transactionId || req.body.transaction_id || req.body.internalId || req.body.internal_id;
  const amount = req.body.amount || req.body.net_amount || req.body.netAmount;
  const customerPhone = req.body.customerPhone || req.body.phone || req.body.phoneNumber || req.body.customer_phone;
  
  if (!orderReference) {
    console.error('[SenePay IPN] Erreur: orderReference (ou order_id) manquant dans le payload');
    return;
  }

  // Déterminer si le paiement a réussi ou échoué
  const isSuccessful = status === 'Complete' || status === 'Completed' || status === 'SUCCESS' || status === 'Success';
  const isFailed = status === 'Failed' || status === 'FAILED' || status === 'Cancelled';

  try {
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(orderReference);

    // Vérifier l'existence de la commande
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      console.warn(`[SenePay IPN] Commande ${orderReference} introuvable dans Firestore`);
      return;
    }

    const orderData = orderDoc.data();

    // Si le paiement a échoué
    if (isFailed) {
      console.log(`[SenePay IPN] Commande ${orderReference} marquée comme ÉCHOUÉE (Statut SenePay: ${status})`);
      await orderRef.update({
        status: 'failed',
        paymentStatus: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentData: {
          transactionId: transactionId || 'N/A',
          reason: req.body.failed_reason || 'Paiement annulé ou refusé',
          provider: 'senepay'
        }
      });
      return;
    }

    if (!isSuccessful) {
      console.log(`[SenePay IPN] Commande ${orderReference} ignorée (Statut inconnu: ${status})`);
      return;
    }

    // GESTION DE LA RÉUSSITE
    if (orderData.paymentStatus === 'paid' || orderData.status === 'completed') {
      console.log(`[SenePay IPN] Commande ${orderReference} déjà marquée comme payée. Skip.`);
      return;
    }

    // 3. Mise à jour Firestore (Succès)
    await orderRef.update({
      status: 'completed',
      paymentStatus: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentMethod: 'wave_senepay',
      paymentData: {
        transactionId: transactionId || orderReference,
        amount: amount,
        customerPhone: customerPhone,
        provider: 'senepay',
        processedAt: new Date().toISOString()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [SenePay IPN] Commande ${orderReference} validée`);

    // 4. Notification SSE
    if (orderData.userId) {
      sseService.notifyOrderUpdate(orderData.userId, {
        type: 'payment-confirmed',
        orderId: orderReference,
        status: 'completed',
        message: 'Votre paiement via SenePay a été confirmé !',
        amount: amount,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error(`❌ [SenePay IPN] Erreur de traitement pour ${orderReference}:`, error);
  }
});

/**
 * Endpoint pour obtenir le statut d'un paiement (optionnel)
 */
router.get('/payment-status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // TODO: Implémenter la récupération du statut depuis la base de données
    res.json({
      token,
      status: 'pending',
      message: 'Statut du paiement récupéré',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[IPN] Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du statut',
      message: error.message
    });
  }
});

/**
 * Endpoint de test pour vérifier que l'IPN est accessible
 */
router.get('/test-ipn', (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint IPN SenePay opérationnel',
    timestamp: new Date().toISOString()
  });
});

export default router;

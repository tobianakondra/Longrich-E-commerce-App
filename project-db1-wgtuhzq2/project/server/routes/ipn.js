/**
 * Gestionnaire IPN (Instant Payment Notification) pour PayDunya/Wave
 * 
 * Ce fichier gère les notifications de paiement instantanées envoyées par PayDunya
 * lorsqu'un paiement est confirmé, annulé ou échoué.
 */

import crypto from 'crypto';
import express from 'express';
import admin from 'firebase-admin';
import sseService from '../services/sseService.js';

const router = express.Router();

// Middleware pour parser le JSON des requêtes IPN
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

/**
 * Vérifie la signature hash de PayDunya pour s'assurer que la requête provient bien de leurs serveurs
 * @param {string} masterKey - La clé principale PayDunya
 * @param {string} receivedHash - Le hash reçu de PayDunya
 * @returns {boolean} - True si la signature est valide
 */
function verifyPayDunyaHash(masterKey, receivedHash) {
  try {
    // Générer le hash SHA-512 de la master key
    const expectedHash = crypto.createHash('sha512').update(masterKey).digest('hex');

    console.log(`[IPN] Hash attendu: ${expectedHash}`);
    console.log(`[IPN] Hash reçu: ${receivedHash}`);
    console.log(`[IPN] Longueur hash attendu: ${expectedHash.length}`);
    console.log(`[IPN] Longueur hash reçu: ${receivedHash.length}`);

    // Vérifier d'abord que les hash ont la même longueur
    if (expectedHash.length !== receivedHash.length) {
      console.log(`[IPN] Longueurs différentes - hash invalide`);
      return false;
    }

    // Comparer les hash de manière sécurisée
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(receivedHash, 'hex')
    );
  } catch (error) {
    console.error('[IPN] Erreur lors de la vérification du hash:', error);
    return false;
  }
}

/**
 * Traite les données de paiement reçues via IPN
 * @param {Object} paymentData - Les données de paiement de PayDunya
 */
function processPaymentData(paymentData) {
  const { invoice, status, customer, receipt_url, custom_data } = paymentData;

  console.log(`[IPN] Traitement du paiement - Token: ${invoice.token}, Statut: ${status}`);

  // Traiter selon le statut du paiement
  switch (status) {
    case 'completed':
      handleSuccessfulPayment(paymentData);
      break;
    case 'cancelled':
      handleCancelledPayment(paymentData);
      break;
    case 'failed':
      handleFailedPayment(paymentData);
      break;
    default:
      console.warn(`[IPN] Statut de paiement inconnu: ${status}`);
  }
}

/**
 * Gère les paiements réussis
 * @param {Object} paymentData - Les données de paiement
 */
async function handleSuccessfulPayment(paymentData) {
  const { invoice, customer, receipt_url, custom_data } = paymentData;

  console.log(`[IPN] Paiement réussi pour le token: ${invoice.token}`);
  console.log(`[IPN] Client: ${customer.name} (${customer.phone})`);
  console.log(`[IPN] Montant: ${invoice.total_amount} FCFA`);
  console.log(`[IPN] Reçu PDF: ${receipt_url}`);

  try {
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(invoice.token);

    // 1. 🔥 METTRE À JOUR FIRESTORE
    await orderRef.update({
      status: 'completed',
      paymentStatus: 'paid',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      receiptUrl: receipt_url || null,
      paymentMethod: 'wave',
      paymentData: {
        transactionId: invoice.token,
        amount: invoice.total_amount,
        currency: 'XOF',
        customerName: customer.name,
        customerPhone: customer.phone,
        processedAt: new Date().toISOString()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [IPN] Commande ${invoice.token} mise à jour dans Firestore`);

    // 2. 🔥 RÉCUPÉRER L'USERID DEPUIS LA COMMANDE
    const orderDoc = await orderRef.get();
    const orderData = orderDoc.data();

    if (orderData && orderData.userId) {
      // 3. 🔥 NOTIFIER VIA SSE
      const notificationSent = sseService.notifyOrderUpdate(orderData.userId, {
        type: 'payment-confirmed',
        orderId: invoice.token,
        status: 'completed',
        message: 'Paiement confirmé avec succès !',
        amount: invoice.total_amount,
        receiptUrl: receipt_url,
        timestamp: new Date().toISOString()
      });

      if (notificationSent) {
        console.log(`✅ [IPN] Notification SSE envoyée à l'utilisateur: ${orderData.userId}`);
      } else {
        console.log(`⚠️ [IPN] Utilisateur ${orderData.userId} non connecté via SSE`);
      }
    } else {
      console.warn(`⚠️ [IPN] UserId non trouvé pour la commande ${invoice.token}`);
    }

    console.log(`✅ [IPN] Paiement traité avec succès pour ${invoice.token}`);

  } catch (error) {
    console.error(`❌ [IPN] Erreur lors du traitement du paiement réussi:`, error);

    // En cas d'erreur, on peut essayer de notifier quand même
    try {
      sseService.broadcast('payment-error', {
        message: 'Erreur lors du traitement du paiement',
        orderId: invoice.token,
        error: error.message
      });
    } catch (broadcastError) {
      console.error(`❌ [IPN] Erreur lors de la diffusion d'erreur:`, broadcastError);
    }
  }
}

/**
 * Gère les paiements annulés
 * @param {Object} paymentData - Les données de paiement
 */
async function handleCancelledPayment(paymentData) {
  const { invoice, customer } = paymentData;

  console.log(`[IPN] Paiement annulé pour le token: ${invoice.token}`);
  console.log(`[IPN] Client: ${customer.name} (${customer.phone})`);

  try {
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(invoice.token);

    // 1. 🔥 METTRE À JOUR FIRESTORE
    await orderRef.update({
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentData: {
        transactionId: invoice.token,
        amount: invoice.total_amount,
        currency: 'XOF',
        customerName: customer.name,
        customerPhone: customer.phone,
        cancelledAt: new Date().toISOString()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [IPN] Commande ${invoice.token} marquée comme annulée dans Firestore`);

    // 2. 🔥 RÉCUPÉRER L'USERID ET NOTIFIER
    const orderDoc = await orderRef.get();
    const orderData = orderDoc.data();

    if (orderData && orderData.userId) {
      // 3. 🔥 NOTIFIER VIA SSE
      const notificationSent = sseService.notifyOrderUpdate(orderData.userId, {
        type: 'payment-cancelled',
        orderId: invoice.token,
        status: 'cancelled',
        message: 'Paiement annulé',
        amount: invoice.total_amount,
        timestamp: new Date().toISOString()
      });

      if (notificationSent) {
        console.log(`✅ [IPN] Notification d'annulation SSE envoyée à l'utilisateur: ${orderData.userId}`);
      } else {
        console.log(`⚠️ [IPN] Utilisateur ${orderData.userId} non connecté via SSE`);
      }
    }

    console.log(`✅ [IPN] Paiement annulé traité pour ${invoice.token}`);

  } catch (error) {
    console.error(`❌ [IPN] Erreur lors du traitement du paiement annulé:`, error);
  }
}

/**
 * Gère les paiements échoués
 * @param {Object} paymentData - Les données de paiement
 */
async function handleFailedPayment(paymentData) {
  const { invoice, customer } = paymentData;

  console.log(`[IPN] Paiement échoué pour le token: ${invoice.token}`);
  console.log(`[IPN] Client: ${customer.name} (${customer.phone})`);

  try {
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(invoice.token);

    // 1. 🔥 METTRE À JOUR FIRESTORE
    await orderRef.update({
      status: 'failed',
      paymentStatus: 'failed',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentData: {
        transactionId: invoice.token,
        amount: invoice.total_amount,
        currency: 'XOF',
        customerName: customer.name,
        customerPhone: customer.phone,
        failedAt: new Date().toISOString()
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ [IPN] Commande ${invoice.token} marquée comme échouée dans Firestore`);

    // 2. 🔥 RÉCUPÉRER L'USERID ET NOTIFIER
    const orderDoc = await orderRef.get();
    const orderData = orderDoc.data();

    if (orderData && orderData.userId) {
      // 3. 🔥 NOTIFIER VIA SSE
      const notificationSent = sseService.notifyOrderUpdate(orderData.userId, {
        type: 'payment-failed',
        orderId: invoice.token,
        status: 'failed',
        message: 'Échec du paiement. Vous pouvez réessayer.',
        amount: invoice.total_amount,
        retryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/retry-payment/${invoice.token}`,
        timestamp: new Date().toISOString()
      });

      if (notificationSent) {
        console.log(`✅ [IPN] Notification d'échec SSE envoyée à l'utilisateur: ${orderData.userId}`);
      } else {
        console.log(`⚠️ [IPN] Utilisateur ${orderData.userId} non connecté via SSE`);
      }
    }

    console.log(`✅ [IPN] Paiement échoué traité pour ${invoice.token}`);

  } catch (error) {
    console.error(`❌ [IPN] Erreur lors du traitement du paiement échoué:`, error);
  }
}

/**
 * Endpoint principal pour recevoir les notifications IPN de PayDunya
 */
router.post('/paydunya-ipn', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[IPN] ${timestamp} - Notification IPN reçue de PayDunya`);
    console.log('[IPN] IP source:', req.ip || req.connection.remoteAddress);
    console.log('[IPN] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[IPN] Body complet:', JSON.stringify(req.body, null, 2));

    // Vérifier que nous avons reçu des données
    if (!req.body || !req.body.data) {
      console.error('[IPN] Données IPN manquantes ou invalides');
      return res.status(400).json({
        error: 'Données IPN manquantes ou invalides',
        received: req.body
      });
    }

    const ipnData = req.body.data;

    // Vérifier les champs obligatoires
    if (!ipnData.hash || !ipnData.invoice || !ipnData.invoice.token) {
      console.error('[IPN] Champs obligatoires manquants dans les données IPN');
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
        required: ['hash', 'invoice.token'],
        received: Object.keys(ipnData)
      });
    }

    // Récupérer la master key depuis les variables d'environnement
    const masterKey = process.env.PAYDUNYA_MASTER_KEY;
    if (!masterKey) {
      console.error('[IPN] PAYDUNYA_MASTER_KEY non configurée');
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    // Vérifier la signature hash
    const isValidHash = verifyPayDunyaHash(masterKey, ipnData.hash);
    if (!isValidHash) {
      console.error('[IPN] Hash invalide - possible tentative de fraude');
      return res.status(403).json({ error: 'Signature invalide' });
    }

    console.log('[IPN] Signature hash vérifiée avec succès');

    // Traiter les données de paiement
    processPaymentData(ipnData);

    // Répondre avec succès à PayDunya
    res.status(200).json({
      status: 'success',
      message: 'IPN traité avec succès',
      token: ipnData.invoice.token,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[IPN] Erreur lors du traitement de l\'IPN:', error);

    // Répondre avec une erreur à PayDunya
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors du traitement de l\'IPN',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint de test pour vérifier que l'IPN fonctionne
 */
router.get('/test-ipn', (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint IPN fonctionnel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Endpoint pour obtenir le statut d'un paiement (optionnel)
 */
router.get('/payment-status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // TODO: Implémenter la récupération du statut depuis la base de données
    // const paymentStatus = await getPaymentStatus(token);

    res.json({
      token,
      status: 'pending', // Remplacer par le statut réel
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

export default router;
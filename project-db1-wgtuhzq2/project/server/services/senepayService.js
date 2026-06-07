/**
 * Service de paiement pour l'API SenePay (Flux Direct)
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const SENEPAY_API_KEY = process.env.SENEPAY_API_KEY;
const SENEPAY_API_SECRET = process.env.SENEPAY_API_SECRET;
const IPN_BASE_URL = process.env.IPN_BASE_URL || 'https://api.longrich.online';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://longrich.online';
const BASE_URL = 'https://api.sene-pay.com';

if (!SENEPAY_API_KEY || !SENEPAY_API_SECRET) {
  console.error('❌ Erreur: Les clés API SenePay ne sont pas définies dans le fichier .env');
}

/**
 * Initie un paiement via SenePay (Flux Direct)
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant à débiter
 * @param {string} paymentData.customerPhone - Téléphone client (+221...)
 * @param {string} paymentData.orderId - Référence de commande
 * @param {string} paymentData.customerName - Nom du client (optionnel)
 * @returns {Promise<Object>} - Réponse de l'API SenePay
 */
export async function initiateWavePayment(paymentData) {
  try {
    console.log(`[SenePay] Initialisation d'un paiement Wave pour ${paymentData.amount} FCFA`);

    const response = await fetch(`${BASE_URL}/api/v1/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': SENEPAY_API_KEY,
        'X-Api-Secret': SENEPAY_API_SECRET
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: 'XOF',
        countryCode: 'SN',
        operator: 'wave',
        customerPhone: paymentData.customerPhone,
        customerName: paymentData.customerName || 'Client Longrich',
        orderId: paymentData.orderId,
        webhookUrl: `${IPN_BASE_URL}/api/ipn/senepay-ipn`,
        returnUrl: `${FRONTEND_URL}/order-success/${paymentData.orderId}`,
        cancelUrl: `${FRONTEND_URL}/cart?status=cancelled`,
        metadata: {
          platform: 'Longrich E-commerce',
          ...paymentData.metadata
        }
      })
    });

    const data = await response.json();
    console.log('[SenePay] Réponse brute de l\'API:', JSON.stringify(data));

    if (!response.ok) {
      console.error('[SenePay] Erreur lors de l\'initialisation:', data);
      throw new Error(data.message || 'Erreur technique SenePay');
    }

    // Récupération robuste des champs (SenePay peut varier entre camelCase et snake_case)
    const internalId = data.internalId || data.internal_id || data.transactionId || data.transaction_id;
    const redirectUrl = data.redirectUrl || data.redirect_url || data.url;
    const token = data.token || data.payment_token;
    const nextAction = data.nextAction || data.next_action;

    console.log(`[SenePay] Paiement initié. ID Interne: ${internalId}`);

    // Pour Wave, SenePay renvoie une redirectUrl
    if ((nextAction === 'REDIRECT_TO_PROVIDER_LINK' || nextAction === 'REDIRECT') && redirectUrl) {
      return {
        success: true,
        redirectUrl: redirectUrl,
        token: token,
        internalId: internalId
      };
    }

    return {
      success: true,
      ...data,
      redirectUrl: redirectUrl, // S'assurer que ces clés existent pour le parent
      internalId: internalId,
      token: token
    };

  } catch (error) {
    console.error('[SenePay] Échec de l\'initiation du paiement:', error.message);
    throw error;
  }
}

export default {
  initiateWavePayment
};

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
        metadata: {
          platform: 'Longrich E-commerce',
          ...paymentData.metadata
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[SenePay] Erreur lors de l\'initialisation:', data);
      throw new Error(data.message || 'Erreur technique SenePay');
    }

    console.log(`[SenePay] Paiement initié avec succès. ID Interne: ${data.internalId}`);

    // Pour Wave, SenePay renvoie une redirectUrl
    if (data.nextAction === 'REDIRECT_TO_PROVIDER_LINK' && data.redirectUrl) {
      return {
        success: true,
        redirectUrl: data.redirectUrl,
        token: data.token,
        internalId: data.internalId
      };
    }

    return {
      success: true,
      ...data
    };

  } catch (error) {
    console.error('[SenePay] Échec de l\'initiation du paiement:', error.message);
    throw error;
  }
}

export default {
  initiateWavePayment
};

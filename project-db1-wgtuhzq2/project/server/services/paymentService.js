/**
 * Service de paiement pour l'API Paydunya
 * Ce service remplace le script shell wave_test.sh en utilisant des requêtes HTTP directes
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import paymentPollingService from './paymentPollingService.js';

// Charger les variables d'environnement
dotenv.config();

// Récupérer les clés API depuis les variables d'environnement
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN;

// Vérifier que les clés sont définies (Désactivé pour migration SenePay)
if (!PAYDUNYA_MASTER_KEY || !PAYDUNYA_PRIVATE_KEY || !PAYDUNYA_TOKEN) {
  console.warn('⚠️ Warning: Les clés API Paydunya ne sont pas définies. Ce service (PayDunya) ne fonctionnera pas, mais SenePay prendra le relais.');
}

// Fonction utilitaire pour les requêtes avec retry
async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${maxRetries} pour ${url}`);
      return await fetch(url, options);
    } catch (error) {
      console.error(`Échec de la tentative ${attempt}/${maxRetries}:`, error.message);
      lastError = error;

      // Attendre avant de réessayer (backoff exponentiel)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Crée une facture de paiement et génère un lien Wave
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant à payer
 * @param {string} paymentData.description - Description du paiement
 * @param {string} paymentData.customerName - Nom du client
 * @param {string} paymentData.customerPhone - Numéro de téléphone du client
 * @param {string} paymentData.customerEmail - Email du client (optionnel)
 * @returns {Promise<string>} - URL de paiement Wave
 */
export async function createWavePayment(paymentData) {
  try {
    // S'assurer que le numéro de téléphone est bien formaté (sans espaces ni caractères spéciaux)
    const phoneNumber = paymentData.customerPhone.replace(/\s+/g, '').trim();

    console.log("Démarrage du processus de paiement Wave avec les données:",
      JSON.stringify({
        ...paymentData,
        customerPhone: phoneNumber.substring(0, 2) + "XXXXX" // Masquer le téléphone dans les logs tout en montrant le préfixe
      }));

    // Étape 1: Créer la facture et obtenir le token
    const invoiceResponse = await fetchWithRetry('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN
      },
      body: JSON.stringify({
        invoice: {
          total_amount: paymentData.amount,
          description: paymentData.description,
          currency: "XOF"
        },
        store: { name: "Longrich" },
        actions: {
          callback_url: `${process.env.FRONTEND_URL || 'https://longrich.online'}`,
          return_url: `${process.env.FRONTEND_URL || 'https://longrich.online'}/profile`,
          cancel_url: `${process.env.FRONTEND_URL || 'https://longrich.online'}`
        }
      })
    });

    // Log de la réponse brute pour le débogage
    const invoiceResponseText = await invoiceResponse.text();
    console.log("Réponse brute de l'API (création facture):", invoiceResponseText);

    let invoiceData;
    try {
      invoiceData = JSON.parse(invoiceResponseText);
    } catch (e) {
      throw new Error(`Réponse non-JSON de l'API: ${invoiceResponseText}`);
    }

    if (!invoiceData.token) {
      throw new Error(`Token de facture non trouvé dans la réponse: ${JSON.stringify(invoiceData)}`);
    }

    console.log("Token obtenu:", invoiceData.token);

    // Étape 2: Générer le lien de paiement Wave avec le token
    const waveResponse = await fetchWithRetry('https://app.paydunya.com/api/v1/softpay/wave-senegal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN
      },
      body: JSON.stringify({
        wave_senegal_fullName: paymentData.customerName || "John Doe",
        wave_senegal_email: paymentData.customerEmail || "test@example.com",
        wave_senegal_phone: phoneNumber, // Utiliser le numéro formaté
        wave_senegal_payment_token: invoiceData.token
      })
    });

    // Log de la réponse brute pour le débogage
    const waveResponseText = await waveResponse.text();
    console.log("Réponse brute de l'API (lien Wave):", waveResponseText);

    let waveData;
    try {
      waveData = JSON.parse(waveResponseText);
    } catch (e) {
      throw new Error(`Réponse non-JSON de l'API Wave: ${waveResponseText}`);
    }

    // Vérifier si la réponse contient l'URL de paiement
    let paymentUrl = null;
    
    if (waveData.response_text === "success" && waveData.response_code === "00") {
      // Format de réponse du script shell
      if (waveData.wave_senegal_checkout_url) {
        console.log("URL de paiement Wave générée avec succès:", waveData.wave_senegal_checkout_url);
        paymentUrl = waveData.wave_senegal_checkout_url;
      }
    } else if (waveData.success && waveData.url) {
      // Format alternatif possible
      console.log("URL de paiement Wave générée avec succès:", waveData.url);
      paymentUrl = waveData.url;
    } else {
      // 🔧 FALLBACK: Si Wave échoue, utiliser l'URL de checkout classique
      console.warn("⚠️ API Wave échouée, utilisation de l'URL de checkout classique");
      console.log("URL de checkout classique:", invoiceData.response_text);
      paymentUrl = invoiceData.response_text; // URL de checkout de la facture
    }

    // 🚀 DÉMARRER LE POLLING AUTOMATIQUEMENT
    if (paymentUrl && paymentData.userId) {
      console.log(`[PaymentService] Démarrage du polling pour token: ${invoiceData.token}, user: ${paymentData.userId}`);
      
      // Démarrer le polling en arrière-plan
      paymentPollingService.startPolling(invoiceData.token, paymentData.userId, {
        amount: paymentData.amount,
        description: paymentData.description,
        customerName: paymentData.customerName,
        customerPhone: phoneNumber,
        paymentUrl: paymentUrl
      });
    } else if (!paymentData.userId) {
      console.warn("⚠️ UserId manquant - polling non démarré");
    }

    return paymentUrl;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur du service de paiement:`, error);
    throw error;
  }
}

/**
 * Vérifie le statut d'un paiement
 * @param {string} token - Token de la transaction
 * @returns {Promise<Object>} - Statut du paiement
 */
export async function checkPaymentStatus(token) {
  try {
    const response = await fetchWithRetry(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN
      }
    });

    const responseText = await response.text();
    console.log("Réponse brute de vérification de statut:", responseText);

    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Réponse non-JSON de l'API de vérification: ${responseText}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur lors de la vérification du statut:`, error);
    throw error;
  }
}

export default {
  createWavePayment,
  checkPaymentStatus
}; 
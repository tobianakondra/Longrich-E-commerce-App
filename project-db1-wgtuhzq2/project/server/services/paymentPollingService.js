/**
 * Service de polling pour vérifier les statuts de paiement PayDunya
 * Approche sécurisée : le serveur poll PayDunya et notifie via SSE
 */

import fetch from 'node-fetch';
import admin from 'firebase-admin';
import sseService from './sseService.js';
import dotenv from 'dotenv';

dotenv.config();

class PaymentPollingService {
  constructor() {
    // Map pour stocker les jobs de polling actifs
    // Clé: paymentToken, Valeur: { intervalId, startTime, userId, attempts }
    this.activeJobs = new Map();
    
    // Configuration
    this.pollingInterval = 15000; // 15 secondes
    this.maxAttempts = 40; // 40 tentatives = 10 minutes
    this.timeoutDuration = 10 * 60 * 1000; // 10 minutes
    
    console.log('[PaymentPolling] Service initialisé');
    console.log(`[PaymentPolling] Intervalle: ${this.pollingInterval}ms`);
    console.log(`[PaymentPolling] Timeout: ${this.timeoutDuration}ms`);
  }

  /**
   * Démarre le polling pour un paiement
   * @param {string} paymentToken - Token du paiement PayDunya
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} orderData - Données de la commande
   */
  startPolling(paymentToken, userId, orderData = {}) {
    // Vérifier si un job existe déjà pour ce token
    if (this.activeJobs.has(paymentToken)) {
      console.log(`[PaymentPolling] Job déjà actif pour token: ${paymentToken}`);
      return;
    }

    console.log(`[PaymentPolling] Démarrage polling pour token: ${paymentToken}, user: ${userId}`);

    const jobData = {
      paymentToken,
      userId,
      orderData,
      startTime: Date.now(),
      attempts: 0,
      intervalId: null
    };

    // Créer l'intervalle de polling
    const intervalId = setInterval(async () => {
      await this.checkPaymentStatus(paymentToken);
    }, this.pollingInterval);

    jobData.intervalId = intervalId;
    this.activeJobs.set(paymentToken, jobData);

    // Programmer l'arrêt automatique après timeout
    setTimeout(() => {
      this.stopPolling(paymentToken, 'timeout');
    }, this.timeoutDuration);

    // Notifier l'utilisateur que la vérification a commencé
    sseService.notifyOrderUpdate(userId, {
      type: 'payment-verification-started',
      orderId: paymentToken,
      message: 'Vérification du paiement en cours...',
      timestamp: new Date().toISOString()
    });

    console.log(`[PaymentPolling] Job créé pour ${paymentToken}, jobs actifs: ${this.activeJobs.size}`);
  }

  /**
   * Vérifie le statut d'un paiement via l'API PayDunya
   * @param {string} paymentToken - Token du paiement
   */
  async checkPaymentStatus(paymentToken) {
    const jobData = this.activeJobs.get(paymentToken);
    if (!jobData) {
      console.log(`[PaymentPolling] Job non trouvé pour token: ${paymentToken}`);
      return;
    }

    jobData.attempts++;
    console.log(`[PaymentPolling] Vérification ${jobData.attempts}/${this.maxAttempts} pour ${paymentToken}`);

    try {
      // Appeler l'API PayDunya pour vérifier le statut
      const response = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${paymentToken}`, {
        method: 'GET',
        headers: {
          'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
          'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
          'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
        }
      });

      const responseText = await response.text();
      console.log(`[PaymentPolling] Réponse PayDunya pour ${paymentToken}:`, responseText);

      let paymentData;
      try {
        paymentData = JSON.parse(responseText);
      } catch (e) {
        console.error(`[PaymentPolling] Réponse non-JSON pour ${paymentToken}:`, responseText);
        return;
      }

      // Analyser la réponse PayDunya
      await this.processPaymentResponse(paymentToken, paymentData);

    } catch (error) {
      console.error(`[PaymentPolling] Erreur lors de la vérification ${paymentToken}:`, error.message);
      
      // Si trop d'erreurs, arrêter le polling
      if (jobData.attempts >= this.maxAttempts) {
        this.stopPolling(paymentToken, 'max-attempts');
      }
    }
  }

  /**
   * Traite la réponse de PayDunya et met à jour le statut
   * @param {string} paymentToken - Token du paiement
   * @param {Object} paymentData - Données de réponse PayDunya
   */
  async processPaymentResponse(paymentToken, paymentData) {
    const jobData = this.activeJobs.get(paymentToken);
    if (!jobData) return;

    console.log(`[PaymentPolling] Traitement réponse pour ${paymentToken}:`, paymentData);

    // Analyser le statut PayDunya
    let status = 'pending';
    let shouldStop = false;

    if (paymentData.response_code === '00') {
      // Paiement confirmé
      status = 'completed';
      shouldStop = true;
      console.log(`[PaymentPolling] ✅ Paiement confirmé pour ${paymentToken}`);
    } else if (paymentData.response_code === '01') {
      // Paiement en attente
      status = 'pending';
      console.log(`[PaymentPolling] ⏳ Paiement en attente pour ${paymentToken}`);
    } else if (paymentData.response_code === '02') {
      // Paiement échoué
      status = 'failed';
      shouldStop = true;
      console.log(`[PaymentPolling] ❌ Paiement échoué pour ${paymentToken}`);
    } else if (paymentData.response_code === '03') {
      // Paiement annulé
      status = 'cancelled';
      shouldStop = true;
      console.log(`[PaymentPolling] 🚫 Paiement annulé pour ${paymentToken}`);
    }

    // Si le statut a changé, mettre à jour Firestore et notifier
    if (status !== 'pending') {
      await this.updateOrderStatus(paymentToken, status, paymentData, jobData);
    }

    // Arrêter le polling si nécessaire
    if (shouldStop) {
      this.stopPolling(paymentToken, `status-${status}`);
    }
  }

  /**
   * Met à jour le statut de la commande dans Firestore
   * @param {string} paymentToken - Token du paiement
   * @param {string} status - Nouveau statut
   * @param {Object} paymentData - Données PayDunya
   * @param {Object} jobData - Données du job
   */
  async updateOrderStatus(paymentToken, status, paymentData, jobData) {
    try {
      const db = admin.firestore();
      const orderRef = db.collection('orders').doc(paymentToken);

      // Préparer les données de mise à jour
      const updateData = {
        status: status,
        paymentStatus: status === 'completed' ? 'paid' : status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentVerification: {
          method: 'polling',
          verifiedAt: new Date().toISOString(),
          attempts: jobData.attempts,
          duration: Date.now() - jobData.startTime,
          paydunyaResponse: paymentData
        }
      };

      // Ajouter des champs spécifiques selon le statut
      if (status === 'completed') {
        updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (status === 'failed') {
        updateData.failedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (status === 'cancelled') {
        updateData.cancelledAt = admin.firestore.FieldValue.serverTimestamp();
      }

      // Mettre à jour Firestore
      await orderRef.update(updateData);
      console.log(`[PaymentPolling] ✅ Firestore mis à jour pour ${paymentToken}: ${status}`);

      // Notifier l'utilisateur via SSE
      const message = this.getStatusMessage(status);
      sseService.notifyOrderUpdate(jobData.userId, {
        type: 'payment-status-updated',
        orderId: paymentToken,
        status: status,
        message: message,
        paymentData: {
          amount: paymentData.invoice?.total_amount,
          method: 'wave',
          verificationMethod: 'polling'
        },
        timestamp: new Date().toISOString()
      });

      console.log(`[PaymentPolling] ✅ Notification SSE envoyée à ${jobData.userId}`);

    } catch (error) {
      console.error(`[PaymentPolling] ❌ Erreur mise à jour Firestore pour ${paymentToken}:`, error);
    }
  }

  /**
   * Arrête le polling pour un paiement
   * @param {string} paymentToken - Token du paiement
   * @param {string} reason - Raison de l'arrêt
   */
  stopPolling(paymentToken, reason = 'manual') {
    const jobData = this.activeJobs.get(paymentToken);
    if (!jobData) {
      console.log(`[PaymentPolling] Aucun job à arrêter pour ${paymentToken}`);
      return;
    }

    // Arrêter l'intervalle
    if (jobData.intervalId) {
      clearInterval(jobData.intervalId);
    }

    // Calculer la durée
    const duration = Date.now() - jobData.startTime;
    console.log(`[PaymentPolling] Arrêt job ${paymentToken} - Raison: ${reason}, Durée: ${duration}ms, Tentatives: ${jobData.attempts}`);

    // Notifier selon la raison
    if (reason === 'timeout') {
      sseService.notifyOrderUpdate(jobData.userId, {
        type: 'payment-verification-timeout',
        orderId: paymentToken,
        message: 'Vérification du paiement expirée. Veuillez contacter le support si vous avez payé.',
        timestamp: new Date().toISOString()
      });
    }

    // Supprimer le job
    this.activeJobs.delete(paymentToken);
    console.log(`[PaymentPolling] Jobs actifs restants: ${this.activeJobs.size}`);
  }

  /**
   * Obtient un message utilisateur selon le statut
   * @param {string} status - Statut du paiement
   * @returns {string} Message pour l'utilisateur
   */
  getStatusMessage(status) {
    switch (status) {
      case 'completed':
        return 'Paiement confirmé avec succès ! Votre commande est validée.';
      case 'failed':
        return 'Le paiement a échoué. Vous pouvez réessayer.';
      case 'cancelled':
        return 'Le paiement a été annulé.';
      default:
        return 'Statut de paiement mis à jour.';
    }
  }

  /**
   * Obtient les statistiques des jobs actifs
   * @returns {Object} Statistiques
   */
  getStats() {
    const stats = {
      activeJobs: this.activeJobs.size,
      jobs: []
    };

    for (const [token, jobData] of this.activeJobs) {
      stats.jobs.push({
        token,
        userId: jobData.userId,
        attempts: jobData.attempts,
        duration: Date.now() - jobData.startTime,
        startTime: new Date(jobData.startTime).toISOString()
      });
    }

    return stats;
  }

  /**
   * Arrête tous les jobs (pour arrêt propre du serveur)
   */
  stopAllJobs() {
    console.log(`[PaymentPolling] Arrêt de tous les jobs (${this.activeJobs.size})`);
    
    for (const [token] of this.activeJobs) {
      this.stopPolling(token, 'server-shutdown');
    }
  }
}

// Instance singleton
const paymentPollingService = new PaymentPollingService();

export default paymentPollingService;
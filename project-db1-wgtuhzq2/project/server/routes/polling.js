/**
 * Routes API pour le service de polling des paiements
 */

import express from 'express';
import paymentPollingService from '../services/paymentPollingService.js';

const router = express.Router();

/**
 * Obtenir les statistiques des jobs de polling actifs
 * GET /api/polling/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = paymentPollingService.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PollingAPI] Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Arrêter manuellement le polling pour un paiement
 * POST /api/polling/stop/:token
 */
router.post('/stop/:token', (req, res) => {
  try {
    const { token } = req.params;
    const { reason = 'manual' } = req.body;

    paymentPollingService.stopPolling(token, reason);

    res.json({
      success: true,
      message: `Polling arrêté pour le token ${token}`,
      token: token,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PollingAPI] Erreur arrêt polling:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'arrêt du polling',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Démarrer manuellement le polling pour un paiement
 * POST /api/polling/start
 */
router.post('/start', (req, res) => {
  try {
    const { paymentToken, userId, orderData = {} } = req.body;

    if (!paymentToken || !userId) {
      return res.status(400).json({
        success: false,
        error: 'paymentToken et userId sont requis',
        timestamp: new Date().toISOString()
      });
    }

    paymentPollingService.startPolling(paymentToken, userId, orderData);

    res.json({
      success: true,
      message: `Polling démarré pour le token ${paymentToken}`,
      paymentToken: paymentToken,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PollingAPI] Erreur démarrage polling:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du démarrage du polling',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Vérifier manuellement le statut d'un paiement (sans polling)
 * GET /api/polling/check/:token
 */
router.get('/check/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Utiliser la méthode de vérification du service de polling
    await paymentPollingService.checkPaymentStatus(token);

    res.json({
      success: true,
      message: `Vérification manuelle effectuée pour ${token}`,
      token: token,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PollingAPI] Erreur vérification manuelle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification manuelle',
      token: req.params.token,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint de santé pour vérifier que le service de polling fonctionne
 * GET /api/polling/health
 */
router.get('/health', (req, res) => {
  try {
    const stats = paymentPollingService.getStats();
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'PaymentPollingService',
      activeJobs: stats.activeJobs,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PollingAPI] Erreur health check:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
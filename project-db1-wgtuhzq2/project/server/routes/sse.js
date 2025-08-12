/**
 * Routes SSE (Server-Sent Events) pour les notifications temps réel
 */

import express from 'express';
import sseService from '../services/sseService.js';

const router = express.Router();

/**
 * Endpoint pour établir une connexion SSE
 * GET /api/sse/connect/:userId
 */
router.get('/connect/:userId', (req, res) => {
  const { userId } = req.params;
  
  console.log(`[SSE ROUTE] Demande de connexion SSE pour l'utilisateur: ${userId}`);
  
  // Valider l'ID utilisateur
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.error('[SSE ROUTE] ID utilisateur invalide');
    return res.status(400).json({ 
      error: 'ID utilisateur requis et valide' 
    });
  }

  // Établir la connexion SSE
  sseService.createConnection(userId, res);
});

/**
 * Endpoint pour tester l'envoi d'événements SSE
 * POST /api/sse/test/:userId
 */
router.post('/test/:userId', (req, res) => {
  const { userId } = req.params;
  const { eventType = 'test', message = 'Message de test' } = req.body;
  
  console.log(`[SSE ROUTE] Test d'événement pour l'utilisateur: ${userId}`);
  
  // Envoyer un événement de test
  const success = sseService.notifyOrderUpdate(userId, {
    type: eventType,
    message: message,
    testData: true,
    timestamp: new Date().toISOString()
  });
  
  if (success) {
    res.json({ 
      success: true, 
      message: 'Événement de test envoyé',
      userId: userId,
      eventType: eventType
    });
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Aucune connexion active pour cet utilisateur',
      userId: userId
    });
  }
});

/**
 * Endpoint pour diffuser un message à tous les utilisateurs connectés
 * POST /api/sse/broadcast
 */
router.post('/broadcast', (req, res) => {
  const { eventType = 'broadcast', message, data } = req.body;
  
  console.log(`[SSE ROUTE] Diffusion d'événement: ${eventType}`);
  
  sseService.broadcast(eventType, {
    message: message || 'Message diffusé à tous les utilisateurs',
    data: data || {},
    broadcastAt: new Date().toISOString()
  });
  
  const stats = sseService.getStats();
  
  res.json({
    success: true,
    message: 'Message diffusé',
    eventType: eventType,
    sentTo: stats.activeConnections,
    stats: stats
  });
});

/**
 * Endpoint pour obtenir les statistiques des connexions SSE
 * GET /api/sse/stats
 */
router.get('/stats', (req, res) => {
  const stats = sseService.getStats();
  
  res.json({
    success: true,
    stats: stats,
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint pour simuler une mise à jour de commande
 * POST /api/sse/simulate-order/:userId
 */
router.post('/simulate-order/:userId', (req, res) => {
  const { userId } = req.params;
  const { 
    orderId = `test_${Date.now()}`,
    status = 'completed',
    amount = 25000,
    products = ['Produit Test']
  } = req.body;
  
  console.log(`[SSE ROUTE] Simulation de mise à jour de commande pour: ${userId}`);
  
  const orderUpdate = {
    id: orderId,
    status: status,
    amount: amount,
    products: products,
    date: new Date().toISOString(),
    simulatedUpdate: true
  };
  
  const success = sseService.notifyOrderUpdate(userId, orderUpdate);
  
  if (success) {
    res.json({
      success: true,
      message: 'Mise à jour de commande simulée envoyée',
      orderUpdate: orderUpdate
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Aucune connexion active pour cet utilisateur',
      userId: userId
    });
  }
});

/**
 * Endpoint pour simuler une notification de paiement
 * POST /api/sse/simulate-payment/:userId
 */
router.post('/simulate-payment/:userId', (req, res) => {
  const { userId } = req.params;
  const {
    paymentId = `payment_${Date.now()}`,
    status = 'completed',
    amount = 30000,
    method = 'wave'
  } = req.body;
  
  console.log(`[SSE ROUTE] Simulation de notification de paiement pour: ${userId}`);
  
  const paymentData = {
    id: paymentId,
    status: status,
    amount: amount,
    method: method,
    timestamp: new Date().toISOString(),
    simulatedPayment: true
  };
  
  const success = sseService.notifyPaymentUpdate(userId, paymentData);
  
  if (success) {
    res.json({
      success: true,
      message: 'Notification de paiement simulée envoyée',
      paymentData: paymentData
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Aucune connexion active pour cet utilisateur',
      userId: userId
    });
  }
});

export default router;
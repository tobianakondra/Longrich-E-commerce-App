/**
 * Service SSE (Server-Sent Events) pour les notifications temps réel
 * Gère les connexions SSE pour notifier les clients des changements de statut de commande
 */

class SSEService {
  constructor() {
    // Map pour stocker les connexions SSE actives
    // Clé: userId, Valeur: { res, lastHeartbeat }
    this.connections = new Map();
    
    // Intervalle pour le heartbeat (30 secondes)
    this.heartbeatInterval = 30000;
    
    // Démarrer le nettoyage périodique des connexions mortes
    this.startHeartbeat();
    
    console.log('[SSE] Service SSE initialisé');
  }

  /**
   * Établir une connexion SSE pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} res - Objet response Express
   */
  createConnection(userId, res) {
    console.log(`[SSE] Nouvelle connexion SSE pour l'utilisateur: ${userId}`);

    // Configurer les en-têtes SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Envoyer un message de connexion initial
    this.sendEvent(res, 'connected', {
      message: 'Connexion SSE établie',
      timestamp: new Date().toISOString(),
      userId: userId
    });

    // Stocker la connexion
    this.connections.set(userId, {
      res: res,
      lastHeartbeat: Date.now(),
      connectedAt: new Date().toISOString()
    });

    // Gérer la fermeture de connexion
    res.on('close', () => {
      console.log(`[SSE] Connexion fermée pour l'utilisateur: ${userId}`);
      this.connections.delete(userId);
    });

    res.on('error', (error) => {
      console.error(`[SSE] Erreur de connexion pour l'utilisateur ${userId}:`, error);
      this.connections.delete(userId);
    });

    console.log(`[SSE] Connexions actives: ${this.connections.size}`);
  }

  /**
   * Envoyer un événement SSE à un client spécifique
   * @param {Object} res - Objet response Express
   * @param {string} eventType - Type d'événement
   * @param {Object} data - Données à envoyer
   */
  sendEvent(res, eventType, data) {
    try {
      const eventData = JSON.stringify(data);
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${eventData}\n\n`);
    } catch (error) {
      console.error('[SSE] Erreur lors de l\'envoi d\'événement:', error);
    }
  }

  /**
   * Notifier un utilisateur spécifique d'une mise à jour de commande
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} orderUpdate - Données de mise à jour de la commande
   */
  notifyOrderUpdate(userId, orderUpdate) {
    const connection = this.connections.get(userId);
    
    if (connection) {
      console.log(`[SSE] Envoi notification de commande à l'utilisateur: ${userId}`);
      console.log(`[SSE] Données de commande:`, orderUpdate);
      
      this.sendEvent(connection.res, 'order-update', {
        type: 'order-update',
        data: orderUpdate,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } else {
      console.log(`[SSE] Aucune connexion active pour l'utilisateur: ${userId}`);
      return false;
    }
  }

  /**
   * Notifier un utilisateur d'un nouveau paiement
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} paymentData - Données du paiement
   */
  notifyPaymentUpdate(userId, paymentData) {
    const connection = this.connections.get(userId);
    
    if (connection) {
      console.log(`[SSE] Envoi notification de paiement à l'utilisateur: ${userId}`);
      
      this.sendEvent(connection.res, 'payment-update', {
        type: 'payment-update',
        data: paymentData,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } else {
      console.log(`[SSE] Aucune connexion active pour l'utilisateur: ${userId}`);
      return false;
    }
  }

  /**
   * Diffuser un message à tous les utilisateurs connectés
   * @param {string} eventType - Type d'événement
   * @param {Object} data - Données à diffuser
   */
  broadcast(eventType, data) {
    console.log(`[SSE] Diffusion à ${this.connections.size} connexions actives`);
    
    for (const [userId, connection] of this.connections) {
      try {
        this.sendEvent(connection.res, eventType, {
          ...data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`[SSE] Erreur lors de la diffusion à l'utilisateur ${userId}:`, error);
        // Supprimer la connexion défaillante
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Envoyer un heartbeat à toutes les connexions actives
   */
  sendHeartbeat() {
    const now = Date.now();
    const connectionsToRemove = [];

    for (const [userId, connection] of this.connections) {
      try {
        // Vérifier si la connexion est encore active (pas de heartbeat depuis 2 minutes)
        if (now - connection.lastHeartbeat > 120000) {
          console.log(`[SSE] Connexion expirée pour l'utilisateur: ${userId}`);
          connectionsToRemove.push(userId);
          continue;
        }

        // Envoyer un ping
        this.sendEvent(connection.res, 'heartbeat', {
          message: 'ping',
          timestamp: new Date().toISOString()
        });

        connection.lastHeartbeat = now;
      } catch (error) {
        console.error(`[SSE] Erreur heartbeat pour l'utilisateur ${userId}:`, error);
        connectionsToRemove.push(userId);
      }
    }

    // Supprimer les connexions mortes
    connectionsToRemove.forEach(userId => {
      this.connections.delete(userId);
    });

    if (connectionsToRemove.length > 0) {
      console.log(`[SSE] ${connectionsToRemove.length} connexions supprimées`);
    }
  }

  /**
   * Démarrer le système de heartbeat
   */
  startHeartbeat() {
    setInterval(() => {
      if (this.connections.size > 0) {
        this.sendHeartbeat();
      }
    }, this.heartbeatInterval);

    console.log(`[SSE] Heartbeat démarré (intervalle: ${this.heartbeatInterval}ms)`);
  }

  /**
   * Obtenir les statistiques des connexions
   */
  getStats() {
    const stats = {
      activeConnections: this.connections.size,
      connections: []
    };

    for (const [userId, connection] of this.connections) {
      stats.connections.push({
        userId,
        connectedAt: connection.connectedAt,
        lastHeartbeat: new Date(connection.lastHeartbeat).toISOString()
      });
    }

    return stats;
  }

  /**
   * Fermer toutes les connexions
   */
  closeAllConnections() {
    console.log(`[SSE] Fermeture de ${this.connections.size} connexions`);
    
    for (const [userId, connection] of this.connections) {
      try {
        this.sendEvent(connection.res, 'server-shutdown', {
          message: 'Serveur en cours d\'arrêt'
        });
        connection.res.end();
      } catch (error) {
        console.error(`[SSE] Erreur lors de la fermeture de connexion ${userId}:`, error);
      }
    }
    
    this.connections.clear();
  }
}

// Instance singleton du service SSE
const sseService = new SSEService();

export default sseService;
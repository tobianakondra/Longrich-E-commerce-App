/**
 * Hook pour gérer l'historique des commandes avec SSE (Server-Sent Events)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import orderService, { Order, OrderStats } from '../services/orderService';

interface UseOrderHistoryReturn {
  orders: Order[];
  stats: OrderStats;
  loading: boolean;
  error: string | null;
  sseConnected: boolean;
  refreshOrders: () => Promise<void>;
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status'], additionalData?: Partial<Order>) => Promise<void>;
}

const SSE_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.longrich.online';

export const useOrderHistory = (): UseOrderHistoryReturn => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  
  // Référence pour la connexion SSE
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Charger les commandes depuis Firestore
   */
  const loadOrders = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOrderHistory] Chargement des commandes...');
      const userOrders = await orderService.getUserOrders(currentUser.uid);
      const orderStats = orderService.calculateOrderStats(userOrders);
      
      setOrders(userOrders);
      setStats(orderStats);
      
      console.log(`[useOrderHistory] ${userOrders.length} commandes chargées`);
      
    } catch (err) {
      console.error('[useOrderHistory] Erreur lors du chargement des commandes:', err);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  /**
   * Établir une connexion SSE
   */
  const connectSSE = useCallback(() => {
    if (!currentUser?.uid || eventSourceRef.current) return;

    const sseUrl = `${SSE_BASE_URL}/api/sse/connect/${currentUser.uid}`;
    console.log(`[useOrderHistory] Connexion SSE: ${sseUrl}`);

    try {
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      // Événement de connexion établie
      eventSource.addEventListener('connected', (event) => {
        console.log('[useOrderHistory] SSE connecté:', event.data);
        setSseConnected(true);
        reconnectAttempts.current = 0;
      });

      // Événement de mise à jour de commande
      eventSource.addEventListener('order-update', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[useOrderHistory] Mise à jour de commande reçue:', data);
          
          // Recharger les commandes pour avoir les données les plus récentes
          loadOrders();
          
        } catch (err) {
          console.error('[useOrderHistory] Erreur lors du traitement de la mise à jour:', err);
        }
      });

      // Événement de mise à jour de paiement
      eventSource.addEventListener('payment-update', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[useOrderHistory] Mise à jour de paiement reçue:', data);
          
          // Recharger les commandes pour avoir les données les plus récentes
          loadOrders();
          
        } catch (err) {
          console.error('[useOrderHistory] Erreur lors du traitement de la mise à jour de paiement:', err);
        }
      });

      // Événement heartbeat
      eventSource.addEventListener('heartbeat', (event) => {
        // Heartbeat silencieux pour maintenir la connexion
        console.log('[useOrderHistory] Heartbeat SSE reçu');
      });

      // Gestion des erreurs de connexion
      eventSource.onerror = (event) => {
        console.error('[useOrderHistory] Erreur SSE:', event);
        setSseConnected(false);
        
        // Fermer la connexion actuelle
        eventSource.close();
        eventSourceRef.current = null;
        
        // Tentative de reconnexion avec backoff exponentiel
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(`[useOrderHistory] Reconnexion SSE dans ${delay}ms (tentative ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectSSE();
          }, delay);
        } else {
          console.error('[useOrderHistory] Nombre maximum de tentatives de reconnexion atteint');
        }
      };

    } catch (err) {
      console.error('[useOrderHistory] Erreur lors de la création de la connexion SSE:', err);
      setSseConnected(false);
    }
  }, [currentUser?.uid, loadOrders]);

  /**
   * Fermer la connexion SSE
   */
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[useOrderHistory] Fermeture de la connexion SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setSseConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  /**
   * Ajouter une nouvelle commande
   */
  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    if (!currentUser?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const newOrder = await orderService.addOrder(currentUser.uid, orderData);
      
      // Recharger les commandes pour mettre à jour l'affichage
      await loadOrders();
      
      return newOrder;
    } catch (err) {
      console.error('[useOrderHistory] Erreur lors de l\'ajout de la commande:', err);
      throw err;
    }
  }, [currentUser?.uid, loadOrders]);

  /**
   * Mettre à jour le statut d'une commande
   */
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], additionalData?: Partial<Order>): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      await orderService.updateOrderStatus(currentUser.uid, orderId, status, additionalData);
      
      // Recharger les commandes pour mettre à jour l'affichage
      await loadOrders();
      
    } catch (err) {
      console.error('[useOrderHistory] Erreur lors de la mise à jour du statut:', err);
      throw err;
    }
  }, [currentUser?.uid, loadOrders]);

  /**
   * Rafraîchir les commandes manuellement
   */
  const refreshOrders = useCallback(async (): Promise<void> => {
    await loadOrders();
  }, [loadOrders]);

  // Effet pour charger les commandes et établir la connexion SSE
  useEffect(() => {
    if (currentUser?.uid) {
      // Charger les commandes
      loadOrders();
      
      // Établir la connexion SSE
      connectSSE();
    }

    // Nettoyage lors du démontage ou changement d'utilisateur
    return () => {
      disconnectSSE();
    };
  }, [currentUser?.uid, loadOrders, connectSSE, disconnectSSE]);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  return {
    orders,
    stats,
    loading,
    error,
    sseConnected,
    refreshOrders,
    addOrder,
    updateOrderStatus
  };
};
/**
 * Service pour gérer les commandes dans Firestore
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  total: number;
  items: number;
  products: string[];
  paymentMethod: 'wave' | 'card' | 'cash';
  customerInfo: {
    name: string;
    phone: string;
    region: string;
    quartier: string;
  };
  waveData?: {
    token: string;
    receiptUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
}

class OrderService {
  /**
   * Récupérer les commandes d'un utilisateur depuis Firestore
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      console.log(`[OrderService] Récupération des commandes pour l'utilisateur: ${userId}`);
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log(`[OrderService] Document utilisateur non trouvé: ${userId}`);
        return [];
      }
      
      const userData = userDoc.data();
      const orders = userData.orders || [];
      
      console.log(`[OrderService] ${orders.length} commandes trouvées`);
      
      // Trier les commandes par date (plus récentes en premier)
      return orders.sort((a: Order, b: Order) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
    } catch (error) {
      console.error('[OrderService] Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  }

  /**
   * Ajouter une nouvelle commande pour un utilisateur
   */
  async addOrder(userId: string, orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      console.log(`[OrderService] Ajout d'une nouvelle commande pour l'utilisateur: ${userId}`);
      
      const now = new Date().toISOString();
      const newOrder: Order = {
        ...orderData,
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const userDocRef = doc(db, 'users', userId);
      
      // Ajouter la commande au tableau des commandes de l'utilisateur
      await updateDoc(userDocRef, {
        orders: arrayUnion(newOrder)
      });
      
      console.log(`[OrderService] Commande ajoutée avec succès: ${newOrder.id}`);
      return newOrder;
      
    } catch (error) {
      console.error('[OrderService] Erreur lors de l\'ajout de la commande:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(userId: string, orderId: string, newStatus: Order['status'], additionalData?: Partial<Order>): Promise<void> {
    try {
      console.log(`[OrderService] Mise à jour du statut de la commande ${orderId} vers ${newStatus}`);
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const userData = userDoc.data();
      const orders = userData.orders || [];
      
      // Trouver et mettre à jour la commande
      const updatedOrders = orders.map((order: Order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            ...additionalData
          };
        }
        return order;
      });
      
      // Vérifier si la commande a été trouvée
      const orderFound = updatedOrders.some((order: Order) => order.id === orderId);
      if (!orderFound) {
        throw new Error(`Commande non trouvée: ${orderId}`);
      }
      
      // Mettre à jour dans Firestore
      await updateDoc(userDocRef, {
        orders: updatedOrders
      });
      
      console.log(`[OrderService] Statut de la commande mis à jour avec succès`);
      
    } catch (error) {
      console.error('[OrderService] Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  /**
   * Supprimer une commande
   */
  async deleteOrder(userId: string, orderId: string): Promise<void> {
    try {
      console.log(`[OrderService] Suppression de la commande: ${orderId}`);
      
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Utilisateur non trouvé');
      }
      
      const userData = userDoc.data();
      const orders = userData.orders || [];
      
      // Trouver la commande à supprimer
      const orderToDelete = orders.find((order: Order) => order.id === orderId);
      if (!orderToDelete) {
        throw new Error(`Commande non trouvée: ${orderId}`);
      }
      
      // Supprimer la commande du tableau
      await updateDoc(userDocRef, {
        orders: arrayRemove(orderToDelete)
      });
      
      console.log(`[OrderService] Commande supprimée avec succès`);
      
    } catch (error) {
      console.error('[OrderService] Erreur lors de la suppression de la commande:', error);
      throw error;
    }
  }

  /**
   * Calculer les statistiques des commandes
   */
  calculateOrderStats(orders: Order[]): OrderStats {
    const stats: OrderStats = {
      totalOrders: orders.length,
      totalSpent: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    orders.forEach(order => {
      // Compter seulement les commandes complétées dans le total dépensé
      if (order.status === 'completed') {
        stats.totalSpent += order.total;
        stats.completedOrders++;
      } else if (order.status === 'pending') {
        stats.pendingOrders++;
      }
    });

    return stats;
  }

  /**
   * Obtenir une commande spécifique par son ID
   */
  async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    try {
      const orders = await this.getUserOrders(userId);
      return orders.find(order => order.id === orderId) || null;
    } catch (error) {
      console.error('[OrderService] Erreur lors de la récupération de la commande:', error);
      throw error;
    }
  }

  /**
   * Créer une commande à partir des données du panier
   */
  createOrderFromCart(cartItems: any[], customerInfo: any, paymentMethod: 'wave' = 'wave'): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const products = cartItems.map(item => item.name);
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      date: new Date().toISOString(),
      status: 'pending',
      total,
      items: itemsCount,
      products,
      paymentMethod,
      customerInfo: {
        name: customerInfo.name || customerInfo.displayName || 'Client',
        phone: customerInfo.phone || '',
        region: customerInfo.region || '',
        quartier: customerInfo.quartier || ''
      }
    };
  }

  /**
   * Formater le statut pour l'affichage
   */
  getStatusLabel(status: Order['status']): string {
    const statusLabels = {
      pending: 'En cours',
      completed: 'Livré',
      cancelled: 'Annulé',
      failed: 'Échoué'
    };
    
    return statusLabels[status] || status;
  }

  /**
   * Obtenir la couleur CSS pour un statut
   */
  getStatusColor(status: Order['status']): string {
    const statusColors = {
      pending: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }
}

// Instance singleton du service
export const orderService = new OrderService();
export default orderService;
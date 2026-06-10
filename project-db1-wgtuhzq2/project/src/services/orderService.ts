/**
 * Service pour gérer les commandes dans Firestore
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  paymentStatus?: 'unpaid' | 'paid' | 'failed';
  total: number;
  amount?: number;
  items: any[] | number;
  products: string[];
  paymentMethod: 'wave' | 'card' | 'cash' | 'wave_senepay';
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
  createdAt: any;
  updatedAt: any;
  userId?: string;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  completedOrders: number;
  pendingOrders: number;
}

class OrderService {
  /**
   * Récupérer les commandes d'un utilisateur depuis Firestore (Collection globale)
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      console.log(`[OrderService] Récupération des commandes pour l'utilisateur: ${userId}`);
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          // Harmonisation des champs entre les anciennes et nouvelles versions
          total: data.total || data.amount || 0,
          date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString())
        } as Order);
      });
      
      console.log(`[OrderService] ${orders.length} commandes trouvées`);
      return orders;
      
    } catch (error) {
      console.error('[OrderService] Erreur lors de la récupération des commandes:', error);
      // Fallback: essayer l'ancienne méthode si l'index n'est pas encore prêt
      return this.getOldUserOrders(userId);
    }
  }

  /**
   * Ancienne méthode de récupération (depuis le document utilisateur)
   */
  private async getOldUserOrders(userId: string): Promise<Order[]> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) return [];
      const userData = userDoc.data();
      return (userData.orders || []).map((o: any) => ({
        ...o,
        total: o.total || o.amount || 0
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      return [];
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
      totalOrders: 0,
      totalSpent: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    orders.forEach(order => {
      // On compte seulement les commandes réellement payées pour les stats principales
      if (order.paymentStatus === 'paid' || order.status === 'completed') {
        const amount = (order.total || order.amount || 0);
        stats.totalSpent += amount;
        stats.completedOrders++;
        stats.totalOrders++; // Seulement les payées comptent ici désormais
      } else if (order.status === 'pending' && order.paymentStatus !== 'failed') {
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
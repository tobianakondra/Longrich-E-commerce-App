import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Coins
} from 'lucide-react';
import { orderService, Order } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'paid' || status === 'completed') {
      return (
        <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Payé
        </span>
      );
    }
    
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" /> En attente
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Échoué
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.phone.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'paid' && (order.paymentStatus === 'paid' || order.status === 'completed')) ||
      (filterStatus === 'pending' && order.status === 'pending' && order.paymentStatus !== 'paid') ||
      (filterStatus === 'failed' && (order.status === 'failed' || order.paymentStatus === 'failed'));

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
        <button 
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et Recherche */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="pending">En attente</option>
            <option value="failed">Échouées</option>
          </select>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white rounded-xl shadow-sm border transition-all ${
                expandedOrder === order.id ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Header de la carte commande */}
              <div 
                className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                      {getStatusBadge(order.status, order.paymentStatus)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(order.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Montant</p>
                    <p className="text-lg font-black text-purple-600">{formatPrice(order.total || order.amount || 0)} FCFA</p>
                  </div>
                  <div className="text-gray-400">
                    {expandedOrder === order.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>
              </div>

              {/* Détails étendus */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-50 p-6 bg-gray-50/50 rounded-b-xl animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Infos Client */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center">
                        <User className="w-4 h-4 mr-2" /> Informations Client
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-800">{order.customerInfo.name}</p>
                        <p className="text-sm flex items-center text-gray-600">
                          <Phone className="w-3.5 h-3.5 mr-2" /> {order.customerInfo.phone}
                        </p>
                        <p className="text-sm flex items-start text-gray-600">
                          <MapPin className="w-3.5 h-3.5 mr-2 mt-0.5" /> 
                          <span>{order.customerInfo.region}, {order.customerInfo.quartier}</span>
                        </p>
                        {order.userId && (
                          <p className="text-[10px] text-gray-400 font-mono mt-2">UID: {order.userId}</p>
                        )}
                      </div>
                    </div>

                    {/* Détails Paiement */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center">
                        <Coins className="w-4 h-4 mr-2" /> Paiement
                      </h4>
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Méthode:</span>
                          <span className="font-medium uppercase">{order.paymentMethod?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Statut:</span>
                          <span className="font-medium">{order.paymentStatus || 'unpaid'}</span>
                        </div>
                        {order.id && (
                          <div className="pt-2 mt-2 border-t border-gray-50 text-[10px] text-gray-400 truncate">
                            REF: {order.id}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Produits */}
                    <div className="space-y-4 md:col-span-2 lg:col-span-1">
                      <h4 className="text-sm font-bold text-gray-400 uppercase flex items-center">
                        <Package className="w-4 h-4 mr-2" /> Produits
                      </h4>
                      <div className="space-y-3">
                        {Array.isArray(order.items) ? (
                          order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-100">
                              <img src={item.image} alt="" className="w-10 h-10 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-gray-500">{item.quantity} x {formatPrice(item.price)} FCFA</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Détails des produits non disponibles</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => window.open(`/order-success/${order.id}`, '_blank')}
                      className="text-purple-600 hover:text-purple-700 text-xs font-bold flex items-center"
                    >
                      Ouvrir la page de reçu <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white py-12 rounded-xl text-center border border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune commande ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

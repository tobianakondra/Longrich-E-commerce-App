import { type FC, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  ShoppingBag,
  Heart,
  Edit3,
  Save,
  X,
  Package,
  Clock,
  MapPin,
  Phone,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatters';
import {
  sendVerificationCode,
  verifyCode,
  formatPhoneNumber,
  validatePhoneNumber
} from '../services/twilioService';
import { useSmsConfig } from '../hooks/useSmsConfig';
import { checkSmsConfig } from '../services/smsConfigService';
import { useOrderHistory } from '../hooks/useOrderHistory';


export const Profile: FC = () => {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { config: smsConfig } = useSmsConfig();
  const [isVerifyingConfig, setIsVerifyingConfig] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: currentUser?.displayName || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || ''
  });
  const [phoneVerification, setPhoneVerification] = useState({
    isVerifying: false,
    isLoading: false,
    code: '',
    isVerified: false,
    error: '',
    verificationSid: ''
  });

  // Utilisation du hook pour récupérer l'historique des commandes depuis Firestore avec SSE
  const { orders: orderHistory, loading: ordersLoading, stats } = useOrderHistory();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Autoriser seulement les chiffres et quelques caractères de formatage
    const sanitizedValue = value.replace(/[^\d\s+-]/g, '');
    setEditForm({ ...editForm, phone: sanitizedValue });

    // Réinitialiser la vérification si le numéro change
    if (sanitizedValue !== currentUser?.phone) {
      setPhoneVerification(prev => ({
        ...prev,
        isVerified: false
      }));
    }
  };

  const handleVerifyPhone = async () => {
    // Valider le format du numéro de téléphone
    if (!validatePhoneNumber(editForm.phone)) {
      setPhoneVerification({
        ...phoneVerification,
        error: 'Format invalide. Utilisez un numéro à 9 chiffres commençant par 77, 78, 76, 70 ou 75.',
        isLoading: false,
        isVerifying: false,
        isVerified: false,
        code: '',
        verificationSid: ''
      });
      return;
    }

    try {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: true,
        error: ''
      }));

      // Vérifier d'abord la configuration SMS
      setIsVerifyingConfig(true);
      const config = await checkSmsConfig();
      setIsVerifyingConfig(false);

      console.log('Configuration SMS récupérée:', config);

      // Si SMS est désactivé, marquer le numéro comme vérifié sans envoyer de requête
      if (!config.smsEnabled) {
        console.log('Vérification SMS désactivée - acceptation automatique sans requête réseau');
        setPhoneVerification(prev => ({
          ...prev,
          isVerified: true,
          isLoading: false,
          error: ''
        }));
        return;
      }

      // Formater le numéro pour Twilio (format international)
      const formattedPhone = formatPhoneNumber(editForm.phone);

      // Envoyer le code de vérification seulement si SMS est activé
      const result = await sendVerificationCode(formattedPhone);

      if (result.success) {
        // Si le mode bypass est activé (SMS désactivé côté serveur)
        if (result.bypassed) {
          setPhoneVerification(prev => ({
            ...prev,
            isVerified: true,
            isLoading: false,
            error: ''
          }));
        } else {
          setPhoneVerification(prev => ({
            ...prev,
            isVerifying: true,
            isLoading: false,
            verificationSid: result.sid || ''
          }));
        }
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          isLoading: false,
          error: result.message
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: false,
        error: 'Une erreur est survenue lors de l\'envoi du code'
      }));
      console.error('Erreur lors de la vérification du téléphone:', error);
    }
  };

  const handleVerifyCode = async () => {
    // Vérifier si la vérification SMS est activée
    if (smsConfig && !smsConfig.smsEnabled) {
      setPhoneVerification(prev => ({
        ...prev,
        isVerified: true,
        isVerifying: false,
        isLoading: false,
        error: ''
      }));
      return;
    }

    // Vérifier que le code a 6 chiffres
    if (!/^\d{6}$/.test(phoneVerification.code)) {
      setPhoneVerification({
        ...phoneVerification,
        error: 'Le code doit contenir 6 chiffres'
      });
      return;
    }

    try {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: true,
        error: ''
      }));

      // Formater le numéro pour Twilio
      const formattedPhone = formatPhoneNumber(editForm.phone);

      // Vérifier le code
      const result = await verifyCode(formattedPhone, phoneVerification.code);

      if (result.success) {
        setPhoneVerification(prev => ({
          ...prev,
          isVerifying: false,
          isLoading: false,
          isVerified: true,
          error: ''
        }));
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          isLoading: false,
          error: result.message
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: false,
        error: 'Une erreur est survenue lors de la vérification du code'
      }));
      console.error('Erreur lors de la vérification du code:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Vérifier si le numéro de téléphone est valide
      if (editForm.phone && !validatePhoneNumber(editForm.phone)) {
        setPhoneVerification({
          ...phoneVerification,
          error: 'Format de numéro invalide'
        });
        return;
      }

      // Si le numéro de téléphone a changé et n'est pas vérifié, demander une vérification
      if (editForm.phone !== currentUser?.phone && !phoneVerification.isVerified) {
        handleVerifyPhone();
        return;
      }

      // Sauvegarder les modifications dans Firebase
      await updateUserProfile({
        displayName: editForm.displayName,
        phone: editForm.phone,
        address: editForm.address
      });

      setIsEditing(false);
      // Réinitialiser l'état de vérification du téléphone
      setPhoneVerification({
        isVerifying: false,
        isLoading: false,
        code: '',
        isVerified: false,
        error: '',
        verificationSid: ''
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Livré':
        return 'bg-green-100 text-green-800';
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'Annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatOrderDate = (createdAt: any) => {
    if (!createdAt) return 'Date inconnue';

    try {
      if (typeof createdAt === 'string') {
        return new Date(createdAt).toLocaleDateString('fr-FR');
      } else if (createdAt && typeof createdAt === 'object' && typeof createdAt.toDate === 'function') {
        return new Date(createdAt.toDate()).toLocaleDateString('fr-FR');
      }
      return 'Date inconnue';
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const statsData = [
    {
      title: 'Commandes totales',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Panier actuel',
      value: items.length,
      icon: ShoppingBag,
      color: 'bg-purple-500'
    },
    {
      title: 'Total dépensé',
      value: `${formatPrice(stats?.totalSpent || 0)} FCFA`,
      icon: Heart,
      color: 'bg-pink-500'
    }
  ];

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Modal de vérification du téléphone */}
      {phoneVerification.isVerifying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Vérification du numéro de téléphone</h3>
            <p className="text-gray-600 mb-4">
              Un code de vérification a été envoyé au {editForm.phone}. Veuillez entrer ce code pour confirmer votre numéro.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code de vérification
              </label>
              <input
                type="text"
                value={phoneVerification.code}
                onChange={(e) => setPhoneVerification({ ...phoneVerification, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Entrez le code à 6 chiffres"
                maxLength={6}
              />
              {phoneVerification.error && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{phoneVerification.error}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleVerifyCode}
                disabled={phoneVerification.isLoading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
              >
                {phoneVerification.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <span>Vérifier</span>
                )}
              </button>
              <button
                onClick={() => setPhoneVerification({ ...phoneVerification, isVerifying: false })}
                disabled={phoneVerification.isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Mon Profil
          </h1>
          <p className="text-gray-600">Gérez vos informations personnelles et consultez vos commandes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentUser.displayName || 'Utilisateur'}
                </h2>
                <p className="text-gray-600">{currentUser.email}</p>
                {currentUser.role === 'admin' && (
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium mt-2">
                    Administrateur
                  </span>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom d'affichage
                      </label>
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <div className="flex">
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={handlePhoneChange}
                          className={`w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${phoneVerification.error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                            }`}
                          placeholder="77XXXXXXX"
                          maxLength={9}
                        />
                        {phoneVerification.isVerified ? (
                          <div className="bg-green-500 text-white px-3 flex items-center justify-center rounded-r-lg">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <button
                            onClick={handleVerifyPhone}
                            disabled={phoneVerification.isLoading || isVerifyingConfig || !editForm.phone}
                            className="bg-purple-600 text-white px-3 rounded-r-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:bg-purple-300"
                          >
                            {phoneVerification.isLoading || isVerifyingConfig ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Vérifier</span>
                            )}
                          </button>
                        )}
                      </div>
                      {phoneVerification.error && (
                        <div className="flex items-center text-red-500 text-xs mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          <span>{phoneVerification.error}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Format: 77XXXXXXX, 78XXXXXXX, etc.</p>
                      {smsConfig && !smsConfig.smsEnabled && (
                        <p className="text-xs text-blue-500 mt-1">Mode vérification SMS désactivé - validation automatique</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse
                      </label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                        placeholder="Votre adresse complète"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={phoneVerification.isLoading}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:from-pink-300 disabled:to-purple-400"
                      >
                        {phoneVerification.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Sauvegarder</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setPhoneVerification({
                            isVerifying: false,
                            isLoading: false,
                            code: '',
                            isVerified: false,
                            error: '',
                            verificationSid: ''
                          });
                          // Réinitialiser le formulaire avec les valeurs actuelles
                          setEditForm({
                            displayName: currentUser?.displayName || '',
                            phone: currentUser?.phone || '',
                            address: currentUser?.address || ''
                          });
                        }}
                        disabled={phoneVerification.isLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">{currentUser.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {currentUser.phone || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">
                        {currentUser.address || 'Non renseignée'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">Membre depuis Déc 2024</span>
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier le profil</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {statsData.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${stat.color} p-2 rounded-lg`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-700 text-sm">{stat.title}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Cart */}
            {items.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-purple-600" />
                    <span>Panier Actuel</span>
                  </h3>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {items.length} article{items.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-purple-600 font-semibold text-sm">
                          {item.quantity}x {formatPrice(item.price)} FCFA
                        </p>
                      </div>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <p className="text-gray-500 text-sm text-center">
                      +{items.length - 3} autre{items.length - 3 > 1 ? 's' : ''} article{items.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold text-gray-900">Total: {formatPrice(totalPrice)} FCFA</span>
                  <button
                    onClick={() => navigate('/cart')}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 text-sm"
                  >
                    Voir le panier
                  </button>
                </div>
              </div>
            )}

            {/* Order History */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Historique des Commandes</span>
                </h3>
                {!ordersLoading && (
                  <span className="text-gray-500 text-sm">{orderHistory.length} commande{orderHistory.length > 1 ? 's' : ''}</span>
                )}
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-3 text-gray-600">Chargement des commandes...</span>
                </div>
              ) : orderHistory.length > 0 ? (
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <div className="flex items-center space-x-3 mb-2 md:mb-0">
                          <span className="font-semibold text-gray-900">#{order.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatOrderDate(order.createdAt)}</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(order.total)} FCFA
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="mb-1">
                          {Array.isArray(order.items)
                            ? `${order.items.length} article${order.items.length > 1 ? 's' : ''}`
                            : `${order.items || 0} article${(order.items || 0) > 1 ? 's' : ''}`
                          }
                        </p>
                        <p className="text-xs">
                          {Array.isArray(order.items)
                            ? order.items.map(item => item.name).join(', ')
                            : 'Détails non disponibles'
                          }
                        </p>
                      </div>

                      <div className="mt-3 flex space-x-2">
                        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                          Voir détails
                        </button>
                        {order.status === 'completed' && (
                          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                            Racheter
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune commande pour le moment</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Découvrir nos produits
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
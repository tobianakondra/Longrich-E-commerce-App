import { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  Star, 
  Gift, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  DollarSign,
  TrendingUp,
  Users,
  Lock,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { ProductManagement } from '../../components/Admin/ProductManagement';
import { AddProductForm } from '../../components/Admin/AddProductForm';
import { FeaturedProductsManager } from '../../components/Admin/FeaturedProductManager';
import { SpecialOffersManager } from '../../components/Admin/SpecialOffersManager';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AccessLog } from '../../types';
import { checkAdminStatus } from '../../utils/setupAdmin';
import { formatPrice } from '../../utils/formatters';

type AdminTab = 'overview' | 'products' | 'add-product' | 'featured' | 'offers' | 'security';

// Nombre maximum de tentatives avant blocage temporaire
const MAX_FAILED_ATTEMPTS = 3;
// Temps de blocage en minutes après avoir dépassé le nombre maximum de tentatives
const LOCKOUT_TIME_MINUTES = 15;

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { products, getFeaturedProducts, getSpecialOffers } = useAdmin();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // États pour la double authentification
  const [isVerifying, setIsVerifying] = useState(true);
  const [secretCode, setSecretCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_FAILED_ATTEMPTS);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [userIdToCheck, setUserIdToCheck] = useState('');
  const [statusResult, setStatusResult] = useState<{isAdmin: boolean; hasSecretCode: boolean} | null>(null);
  const [statusError, setStatusError] = useState('');

  // Définir un titre de page générique pour ne pas révéler qu'il s'agit d'une page d'administration
  useEffect(() => {
    document.title = "Tableau de Gestion | Longrich";
    return () => {
      document.title = "Longrich";
    };
  }, []);

  // Vérifier si l'utilisateur est administrateur
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Récupérer les données utilisateur depuis Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          // Journaliser la tentative d'accès non autorisée
          await logAccess({
            userId: currentUser.uid,
            email: currentUser.email,
            action: 'admin_access_failed',
            details: 'Tentative d\'accès à la page admin sans rôle admin'
          });
          navigate('/');
          return;
        }

        // Vérifier si l'utilisateur est temporairement bloqué
        const userData = userDoc.data();
        if (userData.failedAttempts && userData.failedAttempts >= MAX_FAILED_ATTEMPTS && userData.lastFailedAttempt) {
          const lastFailedAttempt = userData.lastFailedAttempt.toDate();
          const lockoutEndTime = new Date(lastFailedAttempt.getTime() + LOCKOUT_TIME_MINUTES * 60000);
          const now = new Date();
          
          if (now < lockoutEndTime) {
            // L'utilisateur est encore bloqué
            setIsLocked(true);
            const timeRemaining = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000);
            setLockoutTimeRemaining(timeRemaining);
            setIsVerifying(false);
            return;
          } else {
            // La période de blocage est terminée, réinitialiser les tentatives
            await updateDoc(doc(db, "users", currentUser.uid), {
              failedAttempts: 0
            });
          }
        }
        
        setRemainingAttempts(MAX_FAILED_ATTEMPTS - (userData.failedAttempts || 0));
        setIsVerifying(false);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  // Fonction pour journaliser les accès
  const logAccess = async (logData: Partial<AccessLog>) => {
    try {
      // Simplifier la journalisation pour éviter les problèmes de permissions
      console.log(`[LOG] ${logData.action}: ${logData.details || ''} - User: ${logData.userId}`);
      
      // Ne pas essayer d'écrire dans Firestore si nous avons déjà eu une erreur
      if (window.localStorage.getItem('log_error') === 'true') {
        return;
      }
      
      try {
        const timestamp = serverTimestamp();
        const userAgent = navigator.userAgent;
        
        // Créer un nouvel ID unique pour le log
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(db, "access_logs", logId), {
          ...logData,
          timestamp,
          userAgent,
        });
      } catch (logError) {
        // Marquer qu'il y a eu une erreur pour ne pas réessayer
        window.localStorage.setItem('log_error', 'true');
        console.warn("Erreur lors de la journalisation (problème de permissions):", logError);
      }
    } catch (error) {
      console.error("Erreur lors de la préparation de la journalisation:", error);
    }
  };

  // Fonction pour vérifier le code secret
  const verifySecretCode = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setError("Utilisateur non trouvé");
        return;
      }
      
      const userData = userDoc.data();
      
      // Vérifier si l'utilisateur a un code secret défini
      if (!userData.secretCode) {
        setError("Aucun code secret n'est défini pour cet administrateur. Veuillez contacter le développeur.");
        // Journaliser la tentative d'accès sans code secret
        logAccess({
          userId: currentUser.uid,
          email: currentUser.email,
          action: 'admin_access_failed',
          details: "Tentative d'accès sans code secret défini"
        });
        return;
      }
      
      console.log("Vérification du code secret...");
      console.log("Code saisi:", secretCode);
      
      // Vérifier si l'utilisateur a dépassé le nombre maximum de tentatives
      if (userData.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lastFailedAttempt = userData.lastFailedAttempt.toDate();
        const lockoutEndTime = new Date(lastFailedAttempt.getTime() + LOCKOUT_TIME_MINUTES * 60000);
        const now = new Date();
        
        if (now < lockoutEndTime) {
          // L'utilisateur est bloqué
          setIsLocked(true);
          const timeRemaining = Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000);
          setLockoutTimeRemaining(timeRemaining);
          return;
        }
      }
      
      // Vérifier le code secret
      if (userData.secretCode === secretCode) {
        // Code correct
        setIsVerified(true);
        setError(null);
        
        // Réinitialiser les tentatives échouées
        try {
          await updateDoc(userRef, {
            failedAttempts: 0,
            lastLogin: serverTimestamp()
          });
        } catch (updateError) {
          console.warn("Impossible de mettre à jour les tentatives:", updateError);
          // Continuer malgré l'erreur
        }
        
        // Journaliser l'accès réussi
        logAccess({
          userId: currentUser.uid,
          email: currentUser.email,
          action: 'admin_access',
          details: 'Accès admin autorisé avec code secret'
        });
      } else {
        // Code incorrect
        const newFailedAttempts = (userData.failedAttempts || 0) + 1;
        const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        
        // Mettre à jour le nombre de tentatives échouées
        try {
          await updateDoc(userRef, {
            failedAttempts: newFailedAttempts,
            lastFailedAttempt: serverTimestamp()
          });
        } catch (updateError) {
          console.warn("Impossible de mettre à jour les tentatives:", updateError);
          // Continuer malgré l'erreur
        }
        
        // Journaliser la tentative échouée
        logAccess({
          userId: currentUser.uid,
          email: currentUser.email,
          action: 'admin_access_failed',
          details: `Code secret incorrect (tentative ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS})`
        });
        
        if (attemptsRemaining <= 0) {
          // L'utilisateur a épuisé toutes ses tentatives
          setIsLocked(true);
          setLockoutTimeRemaining(LOCKOUT_TIME_MINUTES);
          setError(`Trop de tentatives échouées. Compte temporairement bloqué pour ${LOCKOUT_TIME_MINUTES} minutes.`);
        } else {
          setRemainingAttempts(attemptsRemaining);
          setError(`Code incorrect. Il vous reste ${attemptsRemaining} tentative(s).`);
        }
        
        setSecretCode('');
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du code secret:", error);
      setError("Une erreur est survenue lors de la vérification");
    }
  };

  const handleCheckUserStatus = async () => {
    if (!userIdToCheck.trim()) {
      setStatusError("Veuillez entrer un ID utilisateur valide");
      return;
    }
    
    setIsCheckingStatus(true);
    setStatusError('');
    setStatusResult(null);
    
    try {
      const result = await checkAdminStatus(userIdToCheck);
      setStatusResult(result);
      if (!result) {
        setStatusError("Impossible de vérifier le statut de cet utilisateur");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
      setStatusError("Une erreur s'est produite lors de la vérification");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'accueil
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est en cours de vérification
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est bloqué temporairement
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Accès temporairement bloqué</h2>
            <p className="text-gray-600 mt-2">
              Trop de tentatives incorrectes. Veuillez réessayer dans {lockoutTimeRemaining} minute{lockoutTimeRemaining > 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas encore vérifié avec le code secret
  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Vérification supplémentaire requise</h2>
            <p className="text-gray-600 mt-2">
              Veuillez entrer votre code secret pour accéder au tableau de gestion.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="secretCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code secret
              </label>
              <input
                type="password"
                id="secretCode"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Entrez votre code secret"
                autoComplete="off"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              
              <button
                onClick={verifySecretCode}
                disabled={!secretCode}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vérifier
              </button>
            </div>
            
            {remainingAttempts < MAX_FAILED_ATTEMPTS && (
              <p className="text-sm text-gray-500 text-center">
                Tentatives restantes: {remainingAttempts}/{MAX_FAILED_ATTEMPTS}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // À partir d'ici, l'utilisateur est authentifié et vérifié avec le code secret
  const featuredProducts = getFeaturedProducts();
  const specialOffers = getSpecialOffers();

  const stats = [
    {
      label: 'Produits',
      value: products.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Produits Vedettes',
      value: featuredProducts.length,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Prix Moyen',
      value: `${formatPrice(Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length || 0))} FCFA`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Offres Spéciales',
      value: specialOffers.length,
      icon: Gift,
      color: 'bg-green-500'
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'products', label: 'Gestion Produits', icon: Package },
    { id: 'add-product', label: 'Ajouter Produit', icon: Plus },
    { id: 'featured', label: 'Produits Vedettes', icon: Star },
    { id: 'offers', label: 'Offres Spéciales', icon: Gift },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  const renderSecurityContent = () => {
    return (
      <div className="space-y-6">
        <AdminSecuritySettings />
        
        <div className="bg-white shadow rounded-lg p-4 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vérifier le statut administrateur</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                ID Utilisateur
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="userId"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="ID utilisateur à vérifier"
                  value={userIdToCheck}
                  onChange={(e) => setUserIdToCheck(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCheckUserStatus}
                  disabled={isCheckingStatus || !userIdToCheck.trim()}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
                >
                  {isCheckingStatus ? 'Vérification...' : 'Vérifier'}
                </button>
              </div>
            </div>
            
            {statusError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{statusError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {statusResult && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Résultat de la vérification</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p><strong>ID utilisateur:</strong> {userIdToCheck}</p>
                      <p><strong>Est administrateur:</strong> {statusResult.isAdmin ? 'Oui' : 'Non'}</p>
                      <p><strong>Code secret configuré:</strong> {statusResult.hasSecretCode ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Produits Vedettes Récents
                </h3>
                <div className="space-y-3">
                  {featuredProducts.slice(0, 3).map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-purple-600 font-semibold">{formatPrice(product.price)} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Gift className="w-5 h-5 text-green-500 mr-2" />
                  Offres Spéciales Actives
                </h3>
                <div className="space-y-3">
                  {specialOffers.slice(0, 3).map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-green-600 font-semibold">{formatPrice(product.price)} FCFA</p>
                        <span className="text-xs text-red-500">-{product.discount}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'products':
        return <ProductManagement />;
      case 'add-product':
        return <AddProductForm />;
      case 'featured':
        return <FeaturedProductsManager />;
      case 'offers':
        return <SpecialOffersManager />;
      case 'security':
        return renderSecurityContent();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Gestion du Catalogue
              </h1>
              <p className="text-gray-600">Gérez vos produits et votre boutique</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};
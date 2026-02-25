import { useState, useEffect } from 'react';
import {
  Settings,
  Package,
  Star,
  Gift,
  Plus,
  DollarSign,
  TrendingUp,
  Lock,
  AlertCircle,
  Shield,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { ProductManagement } from '../../components/Admin/ProductManagement';
import { AddProductForm } from '../../components/Admin/AddProductForm';
import { FeaturedProductsManager } from '../../components/Admin/FeaturedProductManager';
import { SpecialOffersManager } from '../../components/Admin/SpecialOffersManager';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { ReviewManagement } from '../../components/Admin/ReviewManagement';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AccessLog } from '../../types';
import { checkAdminStatus } from '../../utils/setupAdmin';
import { formatPrice } from '../../utils/formatters';

type AdminTab = 'overview' | 'products' | 'add-product' | 'featured' | 'offers' | 'reviews' | 'security';

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME_MINUTES = 15;

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { products, getFeaturedProducts, getSpecialOffers } = useAdmin();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(true);
  const [secretCode, setSecretCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_FAILED_ATTEMPTS);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [userIdToCheck, setUserIdToCheck] = useState('');
  const [statusResult, setStatusResult] = useState<{ isAdmin: boolean; hasSecretCode: boolean } | null>(null);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    document.title = "Tableau de Gestion | Longrich";
    return () => { document.title = "Longrich"; };
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          await logAccess({
            userId: currentUser.uid,
            email: currentUser.email,
            action: 'admin_access_failed',
            details: 'Tentative d\'accès à la page admin sans rôle admin'
          });
          navigate('/');
          return;
        }

        const userData = userDoc.data();
        if (userData.failedAttempts && userData.failedAttempts >= MAX_FAILED_ATTEMPTS && userData.lastFailedAttempt) {
          const lastFailedAttempt = userData.lastFailedAttempt.toDate();
          const lockoutEndTime = new Date(lastFailedAttempt.getTime() + LOCKOUT_TIME_MINUTES * 60000);
          const now = new Date();

          if (now < lockoutEndTime) {
            setIsLocked(true);
            setLockoutTimeRemaining(Math.ceil((lockoutEndTime.getTime() - now.getTime()) / 60000));
            setIsVerifying(false);
            return;
          } else {
            await updateDoc(doc(db, "users", currentUser.uid), { failedAttempts: 0 });
          }
        }

        setRemainingAttempts(MAX_FAILED_ATTEMPTS - (userData.failedAttempts || 0));
        setIsVerifying(false);
      } catch (error) {
        console.error("Erreur vérification admin:", error);
        navigate('/');
      }
    };

    checkAdmin();
  }, [currentUser, navigate]);

  const logAccess = async (logData: Partial<AccessLog>) => {
    try {
      console.log(`[LOG] ${logData.action}: ${logData.details || ''}`);
      if (window.localStorage.getItem('log_error') === 'true') return;

      try {
        const timestamp = serverTimestamp();
        const userAgent = navigator.userAgent;
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await setDoc(doc(db, "access_logs", logId), {
          ...logData,
          timestamp,
          userAgent,
        });
      } catch (logError) {
        window.localStorage.setItem('log_error', 'true');
      }
    } catch (error) {
      console.error("Erreur log:", error);
    }
  };

  const verifySecretCode = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      if (!userData.secretCode) {
        setError("Aucun code secret défini. Contactez le dev.");
        return;
      }

      if (userData.secretCode === secretCode) {
        setIsVerified(true);
        await updateDoc(userRef, { failedAttempts: 0, lastLogin: serverTimestamp() });
        logAccess({ userId: currentUser.uid, email: currentUser.email, action: 'admin_access', details: 'Accès autorisé' });
      } else {
        const newFailedAttempts = (userData.failedAttempts || 0) + 1;
        await updateDoc(userRef, { failedAttempts: newFailedAttempts, lastFailedAttempt: serverTimestamp() });

        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTimeRemaining(LOCKOUT_TIME_MINUTES);
          setError(`Compte bloqué pour ${LOCKOUT_TIME_MINUTES} min.`);
        } else {
          setRemainingAttempts(MAX_FAILED_ATTEMPTS - newFailedAttempts);
          setError(`Code incorrect. ${MAX_FAILED_ATTEMPTS - newFailedAttempts} tentative(s) restante(s).`);
        }
        setSecretCode('');
      }
    } catch (error) {
      console.error("Erreur vérification code:", error);
    }
  };

  const handleCheckUserStatus = async () => {
    if (!userIdToCheck.trim()) return;
    setIsCheckingStatus(true);
    try {
      const result = await checkAdminStatus(userIdToCheck);
      setStatusResult(result);
    } catch (error) {
      setStatusError("Erreur vérification statut");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (!currentUser || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès bloqué</h2>
          <p className="text-gray-600 mb-6">Réessayez dans {lockoutTimeRemaining} min.</p>
          <button onClick={() => navigate('/')} className="w-full bg-gray-200 py-2 rounded-lg">Retour</button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Code Secret Requis</h2>
          </div>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <input
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Code secret"
            />
            <div className="flex justify-between items-center">
              <button onClick={() => navigate('/')} className="text-gray-600">Annuler</button>
              <button onClick={verifySecretCode} className="bg-purple-600 text-white px-6 py-2 rounded-lg">Vérifier</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featured = getFeaturedProducts();
  const offers = getSpecialOffers();

  const stats = [
    { label: 'Produits', value: products.length, icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Vedettes', value: featured.length, icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { label: 'Prix Moyen', value: `${formatPrice(Math.round(products.reduce((s, p) => s + p.price, 0) / products.length || 0))} FCFA`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Offres', value: offers.length, icon: Gift, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  ];

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: TrendingUp },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'add-product', label: 'Ajouter', icon: Plus },
    { id: 'featured', label: 'Vedettes', icon: Star },
    { id: 'offers', label: 'Offres', icon: Gift },
    { id: 'reviews', label: 'Avis', icon: MessageCircle },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Catalogue Admin</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-2 mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center text-gray-900"><Star className="w-5 h-5 text-yellow-500 mr-2" /> Dernières Vedettes</h3>
                <div className="space-y-3">
                  {featured.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <img src={p.image} className="w-10 h-10 object-cover rounded" />
                      <div><p className="text-sm font-bold">{p.name}</p><p className="text-xs text-purple-600">{formatPrice(p.price)} FCFA</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center text-gray-900"><Gift className="w-5 h-5 text-pink-500 mr-2" /> Offres du moment</h3>
                <div className="space-y-3">
                  {offers.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <img src={p.image} className="w-10 h-10 object-cover rounded" />
                      <div><p className="text-sm font-bold">{p.name}</p><div className="flex items-center space-x-2"><p className="text-xs text-pink-600 font-bold">{formatPrice(p.price)} FCFA</p><span className="text-[10px] bg-pink-100 text-pink-600 px-1.5 rounded">-{p.discount}%</span></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'add-product' && <AddProductForm />}
        {activeTab === 'featured' && <FeaturedProductsManager />}
        {activeTab === 'offers' && <SpecialOffersManager />}
        {activeTab === 'reviews' && <ReviewManagement />}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <AdminSecuritySettings />
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">Vérification Statut</h3>
              <div className="flex gap-2 mb-4">
                <input type="text" value={userIdToCheck} onChange={(e) => setUserIdToCheck(e.target.value)} placeholder="ID Utilisateur" className="flex-1 px-4 py-2 border rounded-lg" />
                <button onClick={handleCheckUserStatus} disabled={isCheckingStatus} className="bg-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Vérifier</button>
              </div>
              {statusResult && (
                <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-1">
                  <p><strong>Admin:</strong> {statusResult.isAdmin ? 'Oui' : 'Non'}</p>
                  <p><strong>Code Secret:</strong> {statusResult.hasSecretCode ? 'Oui' : 'Non'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
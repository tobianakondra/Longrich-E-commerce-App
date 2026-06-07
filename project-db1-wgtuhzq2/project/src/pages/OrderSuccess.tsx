import { FC, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCart } from '../contexts/CartContext';

export const OrderSuccess: FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    const verifyOrder = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().paymentStatus === 'paid') {
          setIsValid(true);
          setOrderData(docSnap.data());
          // Vider le panier puisque la commande est réussie
          clearCart();
        } else {
          // Si après 5 secondes ce n'est toujours pas marqué payé (délai IPN), 
          // on redirige vers le profil pour qu'il vérifie plus tard
          setTimeout(() => {
            if (!isValid) navigate('/profile');
          }, 5000);
        }
      } catch (error) {
        console.error("Erreur vérification commande:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [orderId, navigate, clearCart, isValid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  if (!isValid) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-purple-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            Paiement Réussi !
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Merci pour votre confiance. Votre commande <span className="font-mono font-bold text-purple-600">#{orderId?.slice(-6).toUpperCase()}</span> a été validée avec succès.
          </p>

          <div className="bg-purple-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-purple-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Récapitulatif de livraison
            </h3>
            <div className="space-y-2 text-sm text-purple-800">
              <p><span className="opacity-70">Client:</span> {orderData.customerInfo.name}</p>
              <p><span className="opacity-70">Téléphone:</span> {orderData.customerInfo.phone}</p>
              <p><span className="opacity-70">Destination:</span> {orderData.customerInfo.region}, {orderData.customerInfo.quartier}</p>
              <p className="pt-2 border-t border-purple-200 mt-2 font-bold text-lg">
                Total: {orderData.amount.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/profile" 
              className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors group"
            >
              Suivre ma commande
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/products" 
              className="flex items-center justify-center px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors"
            >
              <ShoppingBag className="mr-2 w-4 h-4" />
              Continuer mes achats
            </Link>
          </div>
        </div>

        <p className="mt-8 text-gray-400 text-sm italic">
          Un email de confirmation vous a été envoyé. Notre équipe à Ziguinchor vous contactera dès que votre colis sera prêt.
        </p>
      </div>
    </div>
  );
};

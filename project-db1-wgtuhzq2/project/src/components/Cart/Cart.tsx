import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { CartItem } from './CartItem';
import { formatPrice } from '../../utils/formatters';
import CheckoutModal from '../CheckoutModal';
import { checkSmsConfig } from '../../services/smsConfigService';
import { SmsConfig } from '../../hooks/useSmsConfig';

export const Cart: FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, isLoading } = useCart();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isVerifyingConfig, setIsVerifyingConfig] = useState(false);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);

  // Fonction pour gérer le clic sur le bouton de paiement
  const handleCheckoutClick = async () => {
    try {
      setIsVerifyingConfig(true);
      
      // Vérifier la configuration SMS avant d'ouvrir le modal
      const config = await checkSmsConfig();
      
      console.log('Configuration SMS récupérée:', config);
      
      // Stocker la configuration SMS
      setSmsConfig(config);
      
      // Ouvrir le modal de checkout
      setIsCheckoutModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration SMS:', error);
      // En cas d'erreur, ouvrir quand même le modal avec une configuration par défaut
      setSmsConfig({
        smsEnabled: false,
        timestamp: new Date().toISOString()
      });
      setIsCheckoutModalOpen(true);
    } finally {
      setIsVerifyingConfig(false);
    }
  };

  // Fonction pour fermer le modal
  const handleCloseModal = () => {
    setIsCheckoutModalOpen(false);
    // Réinitialiser la configuration SMS
    setSmsConfig(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-8">Votre Panier</h2>
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Votre panier est vide</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Continuer vos achats
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onAuthRequired={() => navigate('/login')}
              />
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h3 className="text-xl font-semibold mb-4">Résumé de la commande</h3>
            <div className="flex justify-between items-center mb-4">
              <span>Total</span>
              <span className="font-bold">{formatPrice(totalPrice)} FCFA</span>
            </div>
            <button
              onClick={handleCheckoutClick}
              disabled={isVerifyingConfig}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
            >
              {isVerifyingConfig ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Préparation...
                </>
              ) : (
                'Procéder au paiement'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de paiement */}
      <CheckoutModal 
        isOpen={isCheckoutModalOpen} 
        onClose={handleCloseModal} 
        initialSmsConfig={smsConfig}
      />
    </div>
  );
}; 
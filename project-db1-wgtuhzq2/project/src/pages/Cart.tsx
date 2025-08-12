import {type FC, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { CartItem } from '../components/Cart/CartItem';
import { useCart } from '../contexts/CartContext';
import CheckoutModal from '../components/CheckoutModal';

export const Cart: FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <ShoppingBag className="w-20 h-20 md:w-24 md:h-24 text-gray-400 mx-auto" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Votre panier est vide</h2>
          <p className="text-gray-600 px-4">Découvrez nos produits et ajoutez-les à votre panier</p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continuer mes achats</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Mon Panier
          </h1>
          <p className="text-gray-600">
            {items.length} article{items.length > 1 ? 's' : ''} dans votre panier
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {items.map((item) => (
              <CartItem 
                key={item.id} 
                item={item}
                onAuthRequired={() => navigate('/login')}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Résumé de la commande</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{totalPrice.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium text-green-600">Gratuite</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">{totalPrice.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Passer la commande</span>
                </button>
                
                <Link
                  to="/products"
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continuer mes achats</span>
                </Link>
                
                <button
                  onClick={clearCart}
                  className="w-full text-red-600 hover:text-red-700 transition-colors duration-200 text-sm"
                >
                  Vider le panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </div>
  );
};
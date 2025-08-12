import { useState, type FC } from 'react';
import { Gift, Gift as GiftOff, Percent } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { formatPrice } from '../../utils/formatters';

export const SpecialOffersManager: FC = () => {
  const { products, toggleSpecialOffer, getSpecialOffers } = useAdmin();
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  
  const specialOffers = getSpecialOffers();
  const regularProducts = products.filter(p => !p.discount);

  const handleToggleOffer = (productId: string) => {
    toggleSpecialOffer(productId, discountPercent);
  };

  return (
    <div className="space-y-8">
      {/* Discount Settings */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-500 p-2 rounded-lg">
            <Percent className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Paramètres des Offres Spéciales</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Pourcentage de réduction à appliquer:
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
      </div>

      {/* Current Special Offers */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-500 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Offres Spéciales Actives</h2>
            <p className="text-gray-600">Ces produits apparaissent dans la section "Offres Spéciales" de l'accueil</p>
          </div>
        </div>

        {specialOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialOffers.map((product) => (
              <div key={product.id} className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="relative mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      -{product.discount}%
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Prix original:</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)} FCFA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Prix promotionnel:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(product.price)} FCFA
                    </span>
                  </div>
                  {product.originalPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Économie:</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatPrice(product.originalPrice - product.price)} FCFA
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => toggleSpecialOffer(product.id)}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  <GiftOff className="w-4 h-4" />
                  <span>Retirer l'offre</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune offre spéciale active pour le moment</p>
          </div>
        )}
      </div>

      {/* Available Products for Special Offers */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gray-500 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajouter aux Offres Spéciales</h2>
            <p className="text-gray-600">Sélectionnez les produits à mettre en promotion</p>
          </div>
        </div>

        {regularProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <div className="relative mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {product.featured && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Gift className="w-3 h-3 mr-1" />
                        Vedette
                      </span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix actuel:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prix avec -{discountPercent}%:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(Math.round(product.price * (1 - discountPercent / 100)))} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Économie:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatPrice(Math.round(product.price * (discountPercent / 100)))} FCFA
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleOffer(product.id)}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  <Gift className="w-4 h-4" />
                  <span>Mettre en promotion</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Tous les produits sont déjà en promotion</p>
          </div>
        )}
      </div>
    </div>
  );
};
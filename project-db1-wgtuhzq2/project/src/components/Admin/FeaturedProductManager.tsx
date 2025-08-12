import { type FC } from 'react';
import { Star, StarOff } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { formatPrice } from '../../utils/formatters';

export const FeaturedProductsManager: FC = () => {
  const { products, toggleFeatured, getFeaturedProducts } = useAdmin();
  const featuredProducts = getFeaturedProducts();
  const nonFeaturedProducts = products.filter(p => !p.featured);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Produits Vedettes</h2>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <p className="text-purple-600 font-semibold mt-1">
                    {formatPrice(product.price)} FCFA
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFeatured(product.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    product.featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {product.featured ? 'Retirer' : 'Ajouter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Produits Vedettes Actuels</h2>
        <div className="space-y-4">
          {featuredProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                  <p className="text-purple-600 font-semibold mt-1">
                    {formatPrice(product.price)} FCFA
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleFeatured(product.id)}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available Products to Feature */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gray-500 p-2 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajouter aux Produits Vedettes</h2>
            <p className="text-gray-600">Sélectionnez les produits à mettre en vedette</p>
          </div>
        </div>

        {nonFeaturedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonFeaturedProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                <div className="relative mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {product.discount && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        -{product.discount}%
                      </span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)} FCFA
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)} FCFA
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleFeatured(product.id)}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                  >
                    <Star className="w-3 h-3" />
                    <span>Mettre en vedette</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Tous les produits sont déjà en vedette</p>
          </div>
        )}
      </div>
    </div>
  );
};
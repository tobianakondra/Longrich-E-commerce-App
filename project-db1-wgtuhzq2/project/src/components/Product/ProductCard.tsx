import { type FC, type MouseEvent } from 'react';
import { ShoppingCart, Star, Package } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export const ProductCard: FC<ProductCardProps> = ({
  product,
  showAddToCart = true
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, () => navigate('/login'));
  };

  const handleClick = () => {
    navigate(`/product/detail/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full cursor-pointer"
    >
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-32 md:h-48 object-cover"
        />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            -{product.discount}%
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <Star className="w-3 h-3 mr-1" />
            <span className="hidden md:inline">Vedette</span>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base h-10 md:h-auto">
          {product.name}
        </h3>
        <p className="text-gray-600 text-xs md:text-sm mb-3 line-clamp-2 hidden md:block">
          {product.description}
        </p>

        {/* Stock status */}
        <div className="flex items-center space-x-1 mb-3">
          <Package className={`w-3 h-3 ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-[10px] md:text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 mt-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm md:text-lg font-bold text-gray-900">
              {formatPrice(product.price)} FCFA
            </span>
            {product.originalPrice && (
              <span className="text-xs md:text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)} FCFA
              </span>
            )}
          </div>

          {showAddToCart && (
            <button
              onClick={handleAddToCart}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium w-full md:w-auto"
            >
              <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Ajouter</span>
              <span className="md:hidden">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
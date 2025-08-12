import { FC } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/formatters';

interface CartItemProps {
  item: CartItemType;
  onAuthRequired: () => void;
}

export const CartItem: FC<CartItemProps> = ({ item, onAuthRequired }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity, onAuthRequired);
  };

  const handleRemove = () => {
    removeFromCart(item.id, onAuthRequired);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 flex items-center space-x-3 md:space-x-4">
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{item.name}</h3>
        <p className="text-gray-600 text-xs md:text-sm truncate hidden md:block">{item.description}</p>
        <p className="text-base md:text-lg font-bold text-purple-600 mt-1">
          {formatPrice(item.price)} FCFA
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="p-1 md:p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Minus className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          
          <span className="w-6 md:w-8 text-center font-semibold text-sm md:text-base">{item.quantity}</span>
          
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="p-1 md:p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
        
        <div className="text-right">
          <p className="font-semibold text-gray-900 text-sm md:text-base">
            {formatPrice(item.price * item.quantity)} FCFA
          </p>
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 transition-colors mt-1 md:mt-2"
          >
            <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
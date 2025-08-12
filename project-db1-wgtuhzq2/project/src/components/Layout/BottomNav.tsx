import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, User, Phone } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav: FC = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { currentUser } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/cart', icon: ShoppingCart, label: 'Panier', badge: totalItems },
    { to: '/contact', icon: Phone, label: 'Contact' },
    { 
      to: currentUser ? '/profile' : '/login', 
      icon: User, 
      label: currentUser ? 'Profil' : 'Compte' 
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-h-[60px] px-2 py-1 transition-colors duration-200 relative ${
                isActive 
                  ? 'text-purple-600' 
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              {/* Badge positioned absolutely above the icon */}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              
              {/* Icon */}
              <div className="flex items-center justify-center mb-1">
                <Icon className="w-6 h-6" />
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
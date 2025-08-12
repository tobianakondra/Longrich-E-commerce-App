import { useState, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

interface HeaderProps {
  adminPath: string;
}

export const Header: FC<HeaderProps> = ({ adminPath }) => {
  const { currentUser, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/products', label: 'Produits' },
    { to: '/about', label: 'À propos' },
    { to: '/contact', label: 'Contact' }
  ];

  // Vérifier si l'utilisateur a le rôle "admin"
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo - Mobile: Only logo and name, Desktop: Full logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Longrich
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to={`/${adminPath}`}
                className="text-gray-700 hover:text-purple-600 transition-colors duration-200 font-medium flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Desktop Right side actions - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors duration-200"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User actions */}
            {currentUser ? (
              <Link
                to="/profile"
                className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Mon Compte</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
            )}
          </div>

          {/* Mobile: Only menu button */}
          <div className="md:hidden">
            <button
              className="p-2 text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Only show on desktop when menu is open */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to={`/${adminPath}`}
                  className="px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Administration</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
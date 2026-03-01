import { useState, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

export const Footer: FC = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    navigate(`/products?category=${category}`);
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Brand section - Always visible */}
        <div className="md:hidden mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <span className="text-xl font-bold">Longrich</span>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-gray-300 text-sm pr-4 max-w-xs">
              Votre destination santé et bien-être.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile: Accordion sections */}
        <div className="md:hidden space-y-2">
          {/* Quick Links Section */}
          <div className="border-t border-gray-800 pt-3">
            <button
              onClick={() => toggleSection('links')}
              className="w-full flex justify-between items-center text-left"
            >
              <h3 className="text-base font-semibold">Liens rapides</h3>
              {expandedSection === 'links' ?
                <ChevronUp className="w-4 h-4 text-gray-400" /> :
                <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </button>

            {expandedSection === 'links' && (
              <ul className="mt-2 space-y-2 text-sm pl-1">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-pink-400 transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-300 hover:text-pink-400 transition-colors">
                    Produits
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-pink-400 transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-pink-400 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Categories Section */}
          <div className="border-t border-gray-800 pt-3">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex justify-between items-center text-left"
            >
              <h3 className="text-base font-semibold">Catégories</h3>
              {expandedSection === 'categories' ?
                <ChevronUp className="w-4 h-4 text-gray-400" /> :
                <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </button>

            {expandedSection === 'categories' && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => handleCategoryClick('health')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Santé
                </button>
                <button
                  onClick={() => handleCategoryClick('body-care')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Soins du corps
                </button>
                <button
                  onClick={() => handleCategoryClick('face-care')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Soins du visage
                </button>
                <button
                  onClick={() => handleCategoryClick('beauty')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Beauté
                </button>
                <button
                  onClick={() => handleCategoryClick('wellness')}
                  className="text-left text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Bien-être
                </button>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="border-t border-gray-800 pt-3">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full flex justify-between items-center text-left"
            >
              <h3 className="text-base font-semibold">Contact</h3>
              {expandedSection === 'contact' ?
                <ChevronUp className="w-4 h-4 text-gray-400" /> :
                <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </button>

            {expandedSection === 'contact' && (
              <div className="mt-2 space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-gray-300">Kénia, Ziguinchor</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <a href="https://wa.me/221789568721" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-300 hover:text-green-500 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>+221 78 956 87 21</span>
                  </a>
                  <a href="https://wa.me/221774404026" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-300 hover:text-green-500 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>+221 77 440 40 26</span>
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-gray-300">contact@longrich.sn</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="text-xl font-bold">Longrich</span>
            </div>
            <p className="text-gray-300 text-sm">
              Votre destination sante et bien-être. Produits de qualité pour prendre soin de vous au quotidien.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Produits
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-pink-400 transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Catégories</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleCategoryClick('health')}
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Santé
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('body-care')}
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Soins du corps
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('face-care')}
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Soins du visage
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('beauty')}
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Beauté
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('wellness')}
                  className="text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                >
                  Bien-être
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-pink-400" />
                <span className="text-gray-300">Kénia, Ziguinchor</span>
              </div>
              <div className="flex flex-col space-y-2">
                <a href="https://wa.me/221789568721" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-300 hover:text-green-500 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span>+221 78 956 87 21</span>
                </a>
                <a href="https://wa.me/221774404026" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-300 hover:text-green-500 transition-colors">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <span>+221 77 440 40 26</span>
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-pink-400" />
                <span className="text-gray-300">contact@longrich.sn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - Both mobile and desktop */}
        <div className="border-t border-gray-800 mt-6 md:mt-12 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-300 text-sm">
              © 2025 Longrich. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/privacy" className="text-gray-300 hover:text-pink-400 transition-colors">
                Politique de confidentialité
              </Link>
              <span className="text-gray-300">Conditions d'utilisation</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
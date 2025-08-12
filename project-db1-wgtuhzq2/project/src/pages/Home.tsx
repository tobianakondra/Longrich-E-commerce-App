import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/Product/ProductGrid';
import { useAdmin } from '../contexts/AdminContext';
import { ArrowRight, Star, Gift } from 'lucide-react';

export const Home: FC = () => {
  const { getFeaturedProducts, getSpecialOffers } = useAdmin();
  const featuredProducts = getFeaturedProducts();
  const specialOffers = getSpecialOffers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white py-12 md:py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6">
            Découvrez le bien-être
            <span className="block text-pink-200">qui vous ressemble</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-pink-100 max-w-3xl mx-auto px-4">
            Des produits de qualité pour prendre soin de vous au quotidien, en mettant l'accent sur votre santé et votre vitalité naturelle.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold hover:bg-pink-50 transition-all duration-200 transform hover:scale-105"
          >
            <span>Découvrir nos produits</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="text-center mb-6 md:mb-10">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Produits Phares
                </h2>
                <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              </div>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4">
                Découvrez nos produits les plus populaires, sélectionnés avec soin pour leur qualité exceptionnelle
              </p>
            </div>
            
            <ProductGrid products={featuredProducts} />
            
            <div className="text-center mt-6 md:mt-8">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                <span>Voir tous les produits</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Special Offers Section */}
        {specialOffers.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="text-center mb-6 md:mb-10">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Gift className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Offres Spéciales
                </h2>
                <Gift className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />
              </div>
              <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4">
                Profitez de nos promotions exceptionnelles sur une sélection de produits
              </p>
            </div>
            
            <ProductGrid products={specialOffers} />
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-12 md:mt-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Rejoignez notre espace santé</h2>
          <p className="text-pink-100 text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
            Inscrivez-vous pour recevoir nos conseils santé exclusifs et être informé de nos dernières nouveautés
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-white text-purple-600 px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold hover:bg-pink-50 transition-all duration-200 transform hover:scale-105"
          >
            <span>Créer mon compte</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Link>
        </section>
      </div>
    </div>
  );
};
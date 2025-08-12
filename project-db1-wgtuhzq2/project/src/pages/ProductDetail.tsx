import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Star, 
  ChevronLeft, 
  Share2, 
  Heart,
  Package,
  Truck,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAdmin } from '../contexts/AdminContext';
import { Product } from '../types';
import { formatPrice } from '../utils/formatters';
import { categories } from '../data/products';
import { ProductCard } from '../components/Product/ProductCard';

export const ProductDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useAdmin();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Trouver le produit actuel
    const currentProduct = products.find(p => p.id === id);
    if (currentProduct) {
      setProduct(currentProduct);
      setSelectedImage(currentProduct.image);
      
      // Trouver des produits similaires (même catégorie, excluant le produit actuel)
      const similar = products
        .filter(p => p.category === currentProduct.category && p.id !== id)
        .slice(0, 4);
      setSimilarProducts(similar);
    }
  }, [id, products]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(
      product,
      () => navigate('/login')
    );
  };

  const categoryName = categories.find(cat => cat.id === product.category)?.name || 'Non catégorisé';

  const benefits = [
    {
      icon: Package,
      title: 'Produit authentique',
      description: 'Garanti 100% original'
    },
    {
      icon: Truck,
      title: 'Livraison rapide',
      description: 'Sous 24-72h'
    },
    {
      icon: Shield,
      title: 'Garantie satisfaction',
      description: '30 jours pour changer d\'avis'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Retour aux produits</span>
          </button>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.discount && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    -{product.discount}%
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    <span>Vedette</span>
                  </div>
                )}
              </div>

              {/* Additional Images (simulated) */}
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setSelectedImage(product.image)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === product.image ? 'border-purple-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
                {/* Placeholder images */}
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm text-purple-600 font-medium">{categoryName}</span>
                  {product.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Produit Vedette
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)} FCFA
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)} FCFA
                    </span>
                  )}
                </div>
                {product.discount && (
                  <p className="text-green-600 font-medium">
                    Économisez {formatPrice(product.originalPrice! - product.price)} FCFA ({product.discount}%)
                  </p>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-gray-700 font-medium">Quantité:</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Ajouter au panier</span>
                </button>
                <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Benefits */}
              <div className="border-t pt-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <benefit.icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Produits similaires</h2>
            {similarProducts.length > 0 && (
              <button
                onClick={() => navigate(`/products?category=${product.category}`)}
                className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                <span>Voir plus</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          {similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {similarProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun produit similaire disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
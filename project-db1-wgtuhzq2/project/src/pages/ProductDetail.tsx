import { useState, useEffect, useMemo, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  Heart,
  ShoppingCart,
  ArrowLeft,
  Star,
  Package,
  ArrowRight,
  MessageCircle,
  User,
  CheckCircle2,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useCart } from '../contexts/CartContext';
import { useReviews } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from '../components/Product/ProductCard';
import { formatPrice } from '../utils/formatters';

export const ProductDetail: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useAdmin();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { getReviewsByProduct, addReview } = useReviews();

  const [quantity, setQuantity] = useState(1);

  // Review form state
  const [reviewName, setReviewName] = useState(currentUser?.displayName || '');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync name when user changes
  useEffect(() => {
    if (currentUser?.displayName) {
      setReviewName(currentUser.displayName);
    }
  }, [currentUser]);

  const product = useMemo(() => products.find(p => p.id === id), [products, id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-6">Désolé, le produit que vous recherchez n'existe pas ou a été retiré.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  const similarProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const benefits = [
    { icon: ShieldCheck, title: 'Qualité Garantie', description: 'Produits 100% authentiques' },
    { icon: Truck, title: 'Livraison Rapide', description: 'Partout au Sénégal' },
    { icon: CheckCircle2, title: 'Satisfaction', description: 'Satisfait ou remboursé' }
  ];

  const handleAddToCart = () => {
    addToCart(product, () => navigate('/login'), quantity);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!reviewName || !reviewComment || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addReview({
        productId: product.id,
        productName: product.name,
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      setSubmitSuccess(true);
      setReviewComment('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Erreur soumission avis:', error);
      alert('Une erreur est survenue lors de l\'envoi de votre avis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productReviews = getReviewsByProduct(product.id);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb / Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-purple-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Retour</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image Section */}
            <div className="p-4 md:p-8 bg-gray-50">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-inner">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                />
                {product.discount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    -{product.discount}%
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Phares
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-12 space-y-8">
              <div>
                <div className="flex items-center space-x-2 text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wider">
                  <span>{product.category}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">{product.name}</h1>

                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-500 text-sm">({productReviews.length} avis clients)</span>
                </div>

                <div className="flex items-end space-x-4">
                  <span className="text-4xl font-black text-gray-900">{formatPrice(product.price)} FCFA</span>
                  {product.originalPrice && (
                    <span className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.originalPrice)} FCFA</span>
                  )}
                </div>
              </div>

              <div className="prose prose-purple max-w-none">
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center space-x-6 bg-gray-50 p-4 rounded-2xl w-fit">
                <span className="font-bold text-gray-700">Quantité</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-200"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-xl text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all duration-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock Info */}
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl w-fit">
                <div className={`w-3 h-3 rounded-full ${product.stock > 10 ? 'bg-green-500 animate-pulse' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-bold ${product.stock > 0 ? 'text-gray-700' : 'text-red-600'}`}>
                  {product.stock > 10
                    ? `En stock (${product.stock} unités)`
                    : product.stock > 0
                      ? `Attention : Plus que ${product.stock} restants !`
                      : 'Rupture de stock'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-purple-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>Ajouter au panier</span>
                </button>
                <div className="flex gap-2">
                  <button className="p-4 rounded-2xl bg-gray-100 hover:bg-pink-50 hover:text-pink-500 transition-all duration-300">
                    <Heart className="w-6 h-6" />
                  </button>
                  <button className="p-4 rounded-2xl bg-gray-100 hover:bg-blue-50 hover:text-blue-500 transition-all duration-300">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex flex-col items-center text-center space-y-2">
                    <div className="bg-purple-50 p-3 rounded-2xl">
                      <benefit.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm uppercase">{benefit.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-gray-900">Vous aimerez aussi</h2>
            {similarProducts.length > 0 && (
              <button
                onClick={() => navigate(`/products?category=${product.category}`)}
                className="flex items-center text-purple-600 hover:text-purple-700 font-bold group"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {similarProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Pas d'autres produits dans cette catégorie</p>
            </div>
          )}
        </div>

        {/* Dynamic Comments Section */}
        <div className="mt-20 bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100">
          <div className="flex items-center justify-between mb-12 border-b pb-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-purple-600" />
              <h2 className="text-3xl font-black text-gray-900">Avis clients</h2>
            </div>
            <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-full">
              <span className="text-purple-700 font-black">{productReviews.length}</span>
              <span className="text-purple-600 font-bold text-sm">avis vérifiés</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-8">
              {productReviews.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-lg">Aucun avis pour le moment</p>
                  <p className="text-gray-400">Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                productReviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-6 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-purple-100 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900">{review.userName}</h4>
                          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Submission Form */}
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 h-fit sticky top-24">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Donner mon avis</h3>

              {!currentUser ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center space-y-6">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-gray-900 text-lg">Connexion requise</p>
                    <p className="text-gray-500 text-sm">Vous devez être connecté pour partager votre expérience avec ce produit.</p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                  >
                    Se connecter
                  </button>
                  <p className="text-xs text-gray-400">Pas de compte ? <button onClick={() => navigate('/register')} className="text-purple-600 font-bold hover:underline">Créer un compte</button></p>
                </div>
              ) : submitSuccess ? (
                <div className="bg-green-100 border border-green-200 text-green-700 p-6 rounded-2xl text-center space-y-3 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 mx-auto" />
                  <p className="font-black text-lg">Merci !</p>
                  <p className="text-sm font-bold">Votre avis a été publié avec succès.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Votre Nom</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Ex: Marie D."
                      readOnly={!!currentUser}
                      className={`w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-purple-500 outline-none transition-all shadow-sm font-bold ${currentUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Votre Note</label>
                    <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl shadow-sm border-2 border-white">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Votre Message</label>
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Dites-nous ce que vous en pensez..."
                      className="w-full px-5 py-4 rounded-2xl border-2 border-white bg-white focus:border-purple-500 outline-none resize-none h-40 transition-all shadow-sm font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-purple-100 disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting ? 'Envoi...' : 'Envoyer l\'avis'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

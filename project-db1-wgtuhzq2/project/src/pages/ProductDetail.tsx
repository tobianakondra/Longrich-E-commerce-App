import { useState, useEffect, useMemo, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  ShoppingCart,
  ArrowLeft,
  Star,
  Package,
  ArrowRight,
  MessageCircle,
  User,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Copy,
  Facebook,
  Instagram,
  Check,
  X as CloseIcon
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useCart } from '../contexts/CartContext';
import { useReviews } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import { ProductCard } from '../components/Product/ProductCard';
import { formatPrice } from '../utils/formatters';
import { useSEO } from '../hooks/useSEO';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const product = useMemo(() => products.find(p => p.id === id), [products, id]);

  useSEO({
    title: product?.name,
    description: product?.description,
    image: product?.image,
    type: 'product',
  });

  // Ajouter des données structurées JSON-LD
  useEffect(() => {
    if (product) {
      const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": [product.image],
        "description": product.description,
        "sku": product.id,
        "brand": {
          "@type": "Brand",
          "name": "Longrich"
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "XOF",
          "price": product.price,
          "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        },
        "aggregateRating": productReviews.length > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": (productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length).toFixed(1),
          "reviewCount": productReviews.length
        } : undefined
      };

      let script = document.getElementById('json-ld-product');
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld-product';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);

      return () => {
        const scriptToRemove = document.getElementById('json-ld-product');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [product, productReviews]);

  // Sync name when user changes
  useEffect(() => {
    if (currentUser?.displayName) {
      setReviewName(currentUser.displayName);
    }
  }, [currentUser]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(() => setIsShareModalOpen(true));
    } else {
      setIsShareModalOpen(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      url: `https://wa.me/?text=${encodeURIComponent(`${product.name}\n${window.location.href}`)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600',
      onClick: () => {
        copyToClipboard();
        alert('Lien copié ! Vous pouvez maintenant le coller dans votre story ou bio Instagram.');
      }
    },
  ];

  const productReviews = getReviewsByProduct(product.id);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Partager</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <CloseIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => {
                      if (option.url) window.open(option.url, '_blank');
                      if (option.onClick) option.onClick();
                      setIsShareModalOpen(false);
                    }}
                    className="flex flex-col items-center space-y-2 group"
                  >
                    <div className={`${option.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <option.icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold text-gray-600">{option.name}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Copy className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  readOnly
                  value={window.location.href}
                  className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium text-gray-500 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center space-x-1"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <span>Copier</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Partagez la qualité Longrich</p>
            </div>
          </div>
        </div>
      )}
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
                  <button
                    onClick={handleShare}
                    className="flex-1 sm:flex-none p-4 rounded-2xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-6 h-6" />
                    <span className="font-bold sm:hidden">Partager</span>
                  </button>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-8 border-t">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                    <div className="bg-purple-50 p-2 sm:p-3 rounded-xl sm:rounded-2xl">
                      <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-[8px] sm:text-xs md:text-sm uppercase leading-tight">{benefit.title}</h4>
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
        <div className="mt-12 md:mt-20 bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-12 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 border-b pb-6 gap-4">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Avis clients</h2>
            </div>
            <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-full self-start sm:self-auto shadow-sm border border-purple-100">
              <span className="text-purple-700 font-black text-sm md:text-base">{productReviews.length}</span>
              <span className="text-purple-600 font-bold text-[10px] md:text-sm whitespace-nowrap uppercase tracking-wider">avis vérifiés</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {productReviews.length === 0 ? (
                <div className="text-center py-12 md:py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-base md:text-lg">Aucun avis pour le moment</p>
                  <p className="text-gray-400 text-sm">Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                productReviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-4 sm:p-6 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-purple-100 group">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-gray-900 text-sm sm:text-base truncate md:whitespace-normal">{review.userName}</h4>
                          <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest block mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {/* Stars on mobile - moved next to name/date if needed, but let's see */}
                      </div>
                      <div className="flex items-center space-x-0.5 bg-white/50 px-2 py-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed italic border-l-4 border-purple-200 pl-4 py-1">"{review.comment}"</p>
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

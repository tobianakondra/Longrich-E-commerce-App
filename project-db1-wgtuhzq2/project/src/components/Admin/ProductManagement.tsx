import { useState, type FC, type ChangeEvent, type DragEvent, type FormEvent, useRef, useEffect } from 'react';
import { 
  Edit3, 
  Trash2, 
  Star, 
  Gift, 
  DollarSign, 
  Eye,
  Search,
  Filter,
  X,
  Upload,
  Edit2,
  AlertTriangle
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Product, ProductCategory, AdminProductForm } from '../../types';
import { categories } from '../../data/products';
import { formatPrice } from '../../utils/formatters';

// Composant Modal pour éditer un produit
interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Product>) => Promise<void>;
}

const EditProductModal: FC<EditProductModalProps> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
    category: product.category,
    description: product.description,
    featured: product.featured,
    discount: product.discount
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      encodeImageToBase64(file);
    }
  };

  const encodeImageToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setFormData(prev => ({ ...prev, image: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Vérifier si c'est une image
      if (file.type.startsWith('image/')) {
        encodeImageToBase64(file);
      } else {
        alert('Veuillez déposer uniquement des fichiers image.');
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier si une image a été chargée
      if (!formData.image) {
        alert('Veuillez ajouter une image pour le produit.');
        setLoading(false);
        return;
      }

      // Préparer les données à envoyer à Firestore
      const preparedData: Partial<Product> = {
        ...formData,
        // Convertir undefined en null pour Firestore
        originalPrice: formData.originalPrice || null,
        discount: formData.discount || null
      };
      
      // Calculer le prix avec réduction si applicable
      if (preparedData.discount && preparedData.discount > 0 && preparedData.price) {
        const originalPrice = preparedData.originalPrice || preparedData.price;
        const discountedPrice = Math.round(originalPrice * (1 - preparedData.discount / 100));
        preparedData.price = discountedPrice;
        preparedData.originalPrice = originalPrice;
      }

      await onSave(product.id, preparedData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification du produit:', error);
      alert('Une erreur est survenue lors de la modification du produit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Modifier le produit</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du produit */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Prix (FCFA) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Prix original (optionnel)
              </label>
              <input
                type="number"
                id="originalPrice"
                name="originalPrice"
                min="0"
                value={formData.originalPrice || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Réduction */}
          <div>
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
              Réduction (%) - optionnel
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              min="0"
              max="90"
              value={formData.discount || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            {formData.discount && formData.discount > 0 && formData.price && (
              <p className="text-sm text-gray-600 mt-1">
                Prix après réduction: {Math.round((formData.originalPrice || formData.price) * (1 - formData.discount / 100)).toLocaleString()} FCFA
              </p>
            )}
          </div>

          {/* Zone de dépôt d'image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image du produit *
            </label>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {!imagePreview ? (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-gray-700">Glissez-déposez une image ici ou cliquez pour parcourir</p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG (max 5MB)</p>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Aperçu" 
                    className="h-48 mx-auto object-contain rounded-lg"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured || false}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                Mettre en vedette (apparaîtra dans "Produits Phares")
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductManagement: FC = () => {
  const { products, deleteProduct, toggleFeatured, toggleSpecialOffer, updatePrice, updateProduct } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePriceEdit = (product: Product) => {
    setEditingPrice(product.id);
    setNewPrice(product.price);
  };

  const handlePriceSave = (productId: string) => {
    updatePrice(productId, newPrice);
    setEditingPrice(null);
  };

  const handleDelete = (productId: string, productName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
      deleteProduct(productId);
    }
  };

  const handleToggleSpecialOffer = (productId: string) => {
    toggleSpecialOffer(productId, discountPercent);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleSaveProduct = async (id: string, updates: Partial<Product>) => {
    await updateProduct(id, updates);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Gestion des Produits</h2>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                {product.featured && (
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Vedette
                  </span>
                )}
                {product.discount && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    -{product.discount}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              {/* Price Section */}
              <div className="mb-4">
                {editingPrice === product.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handlePriceSave(product.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingPrice(null)}
                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
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
                      onClick={() => handlePriceEdit(product)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Modifier</span>
                </button>
                
                <button
                  onClick={() => toggleFeatured(product.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    product.featured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>{product.featured ? 'Retirer vedette' : 'Mettre en vedette'}</span>
                </button>
                
                <button
                  onClick={() => handleToggleSpecialOffer(product.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    product.discount
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Gift className="w-3 h-3" />
                  <span>{product.discount ? 'Retirer promo' : 'Mettre en promo'}</span>
                </button>
                
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
        </div>
      )}

      {/* Discount Settings */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Paramètres des Promotions</h3>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Pourcentage de réduction par défaut:
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
      </div>

      {/* Modal d'édition */}
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};
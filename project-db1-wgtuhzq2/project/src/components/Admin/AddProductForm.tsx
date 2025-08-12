import { useState, useRef, useCallback, type FC, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Plus, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminProductForm, ProductCategory } from '../../types';
import { categories } from '../../data/products';

export const AddProductForm: FC = () => {
  const { addProduct } = useAdmin();
  const [formData, setFormData] = useState<AdminProductForm>({
    name: '',
    price: 0,
    originalPrice: undefined,
    image: '',
    category: 'beauty',
    description: '',
    featured: false,
    discount: undefined
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const preparedData: AdminProductForm = {
        ...formData,
        // Convertir undefined en null pour Firestore
        originalPrice: formData.originalPrice || null,
        discount: formData.discount || null
      };
      
      // Calculer le prix avec réduction si applicable
      if (preparedData.discount && preparedData.discount > 0) {
        const originalPrice = preparedData.originalPrice || preparedData.price;
        const discountedPrice = Math.round(originalPrice * (1 - preparedData.discount / 100));
        preparedData.price = discountedPrice;
        preparedData.originalPrice = originalPrice;
      }

      await addProduct(preparedData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        price: 0,
        originalPrice: undefined,
        image: '',
        category: 'beauty',
        description: '',
        featured: false,
        discount: undefined
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      alert('Une erreur est survenue lors de l\'ajout du produit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Ajouter un Nouveau Produit</h2>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            Produit ajouté avec succès !
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Ex: Sérum Anti-Âge Premium"
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
              placeholder="Description détaillée du produit..."
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
                placeholder="15000"
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
                placeholder="18000"
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
              placeholder="20"
            />
            {formData.discount && formData.discount > 0 && (
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
                checked={formData.featured}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                Mettre en vedette (apparaîtra dans "Produits Phares")
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Ajout en cours...' : 'Ajouter le produit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
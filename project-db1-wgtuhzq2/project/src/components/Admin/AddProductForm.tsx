import { useState, type FC } from 'react';
import { Plus } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { categories } from '../../data/products';
import { ImageUploader } from './ImageUploader';

export const AddProductForm: FC = () => {
  const { addProduct } = useAdmin();
  const [formData, setFormData] = useState<any>({
    name: '',
    price: 0,
    originalPrice: undefined,
    image: '',
    category: 'beauty',
    description: '',
    featured: false,
    discount: undefined,
    stock: 1
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const UPLOADCARE_PUB_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev: any) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (!file) setFormData((prev: any) => ({ ...prev, image: '' }));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setFormData((prev: any) => ({ ...prev, image: '' }));
  };

  const uploadToUploadcare = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUB_KEY);
    uploadFormData.append('UPLOADCARE_STORE', '1');
    uploadFormData.append('file', file);

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: uploadFormData
    });

    if (!response.ok) throw new Error("Erreur upload");
    const data = await response.json();
    return `https://15pz83n613.ucarecd.net/${data.file}/-/preview/720x720/-/quality/smart/-/format/auto/`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image;

      // Si une nouvelle image a été sélectionnée, on l'upload maintenant
      if (selectedFile) {
        finalImageUrl = await uploadToUploadcare(selectedFile);
      }

      if (!finalImageUrl) {
        alert('Veuillez ajouter une image pour le produit.');
        setLoading(false);
        return;
      }

      // Validation du stock : doit être un nombre entier strictement positif
      const stockValue = Math.round(Number(formData.stock));

      if (isNaN(stockValue) || stockValue <= 0) {
        alert('Le stock doit être un nombre entier strictement positif.');
        setLoading(false);
        return;
      }

      const preparedData = {
        ...formData,
        image: finalImageUrl,
        stock: stockValue,
        originalPrice: formData.originalPrice || null,
        discount: formData.discount || null
      };

      if (preparedData.discount && preparedData.discount > 0) {
        const originalPrice = preparedData.originalPrice || preparedData.price;
        const discountedPrice = Math.round(originalPrice * (1 - preparedData.discount / 100));
        preparedData.price = discountedPrice;
        preparedData.originalPrice = originalPrice;
      }

      await addProduct(preparedData);
      setSuccess(true);
      setSelectedFile(null);

      setFormData({
        name: '',
        price: 0,
        originalPrice: undefined,
        image: '',
        category: 'beauty',
        description: '',
        featured: false,
        discount: undefined,
        stock: 1
      });

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
                onWheel={(e) => e.currentTarget.blur()}
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
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="18000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock disponible *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              required
              min="1"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Ex: 50"
            />
            <p className="text-xs text-gray-500 mt-1">Nombre d'unités disponibles à la vente</p>
          </div>

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
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="20"
            />
            {formData.discount && formData.discount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Prix après réduction: {Math.round((formData.originalPrice || formData.price) * (1 - formData.discount / 100)).toLocaleString()} FCFA
              </p>
            )}
          </div>

          <ImageUploader 
            value={formData.image} 
            onFileSelect={handleFileSelect} 
            onRemove={handleRemoveImage} 
          />

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Ajout en cours...' : 'Ajouter le produit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
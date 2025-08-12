import { useState, useMemo, useEffect, type FC } from 'react';
import { ProductGrid } from '../components/Product/ProductGrid';
import { CategoryFilter } from '../components/Product/CategoryFilter';
import { ProductCategory, Product } from '../types';
import { Search, FilterX, Loader } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const Products: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits depuis Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        
        if (productsSnapshot.empty) {
          setProducts([]);
        } else {
          const productsData = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setProducts(productsData);
        }
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        setError('Impossible de charger les produits. Veuillez réessayer plus tard.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priceRange) {
      filtered = filtered.filter(product => 
        product.price >= priceRange[0] && product.price <= priceRange[1]
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery, priceRange]);

  const handlePriceRangeSelect = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || priceRange !== null || searchQuery !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Nos Produits
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4">
            Découvrez notre gamme complète de produits beauté et bien-être sélectionnés avec soin
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onPriceRangeSelect={handlePriceRangeSelect}
            activePriceRange={priceRange}
          />
          
          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {priceRange && (
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <span>Prix: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA</span>
                  <button 
                    onClick={() => setPriceRange(null)}
                    className="ml-2 text-purple-500 hover:text-purple-700"
                  >
                    ×
                  </button>
                </div>
              )}
              
              <button
                onClick={clearFilters}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
              >
                <FilterX className="w-3 h-3" />
                <span>Effacer les filtres</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <ProductGrid 
            products={filteredProducts}
            title={`${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''} trouvé${filteredProducts.length > 1 ? 's' : ''}`}
          />
        )}
      </div>
    </div>
  );
};
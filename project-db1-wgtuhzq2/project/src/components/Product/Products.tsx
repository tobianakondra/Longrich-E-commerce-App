import { type FC } from 'react';
import { ProductCard } from './ProductCard';
import { type Product } from '../../types';
import { formatPrice } from '../../utils/formatters';

export const Products: FC = () => {
  const products: Product[] = []; // Temporary empty array until we implement product fetching
  const loading = false;
  const error = null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Une erreur est survenue lors du chargement des produits.
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center text-gray-500 p-4">
        Aucun produit disponible.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}; 
import { type FC } from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export const ProductGrid: FC<ProductGridProps> = ({ products, title }) => {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      
      {/* Mobile: 2 columns, Desktop: 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
};
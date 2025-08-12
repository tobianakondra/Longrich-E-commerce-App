import { type FC } from 'react';
import { ProductCategory } from '../../types';

interface ProductFilterProps {
  selectedCategories: ProductCategory[];
  onCategoryChange: (category: ProductCategory) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export const ProductFilter: FC<ProductFilterProps> = ({
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceRangeChange
}) => {
  const categories: ProductCategory[] = [
    'health', 
    'body-care', 
    'face-care', 
    'beauty', 
    'wellness'
  ];

  const categoryLabels: Record<ProductCategory, string> = {
    'health': 'Santé',
    'body-care': 'Soins du corps',
    'face-care': 'Soins du visage',
    'beauty': 'Beauté',
    'wellness': 'Bien-être'
  };

  const handlePriceChange = (min: number, max: number) => {
    onPriceRangeChange([min, max]);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Catégories</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <label 
              key={category} 
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => onCategoryChange(category)}
                className="form-checkbox text-purple-600 h-4 w-4"
              />
              <span className="text-gray-700">
                {categoryLabels[category]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Prix</h3>
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => handlePriceChange(Number(e.target.value), priceRange[1])}
            className="w-1/2 px-2 py-1 border rounded text-sm"
            placeholder="Min"
          />
          <span>-</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => handlePriceChange(priceRange[0], Number(e.target.value))}
            className="w-1/2 px-2 py-1 border rounded text-sm"
            placeholder="Max"
          />
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full relative mt-4">
          <div 
            className="absolute h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
            style={{
              left: `${(priceRange[0] / 50000) * 100}%`,
              right: `${100 - (priceRange[1] / 50000) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}; 
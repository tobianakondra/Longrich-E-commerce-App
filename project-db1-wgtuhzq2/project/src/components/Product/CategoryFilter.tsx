import { useState, type FC } from 'react';
import { ProductCategory } from '../../types';
import { categories } from '../../data/products';
import * as LucideIcons from 'lucide-react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: ProductCategory | 'all';
  onCategoryChange: (category: ProductCategory | 'all') => void;
  onPriceRangeSelect?: (min: number, max: number) => void;
  activePriceRange?: [number, number] | null;
}

export const CategoryFilter: FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  onPriceRangeSelect,
  activePriceRange
}) => {
  const [showPriceFilters, setShowPriceFilters] = useState(false);
  const [showDesktopPriceFilters, setShowDesktopPriceFilters] = useState(false);
  
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  const priceRanges = [
    { label: 'Moins de 5000 FCFA', min: 0, max: 5000 },
    { label: '5000 - 10000 FCFA', min: 5000, max: 10000 },
    { label: '10000 - 15000 FCFA', min: 10000, max: 15000 },
    { label: 'Plus de 15000 FCFA', min: 15000, max: 50000 }
  ];

  // Fonction pour vérifier si une plage de prix est active
  const isPriceRangeActive = (min: number, max: number) => {
    return activePriceRange && activePriceRange[0] === min && activePriceRange[1] === max;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6 md:mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Filtrer par catégorie</h3>
      
      {/* Desktop: Flex wrap */}
      <div className="hidden md:flex md:flex-wrap gap-3">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-base ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>Tous</span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id as ProductCategory)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-base ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{getIcon(category.icon)}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
      
      {/* Mobile: 3x2 Grid */}
      <div className="md:hidden grid grid-cols-3 gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-2 py-2 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center text-xs ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>Tous</span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id as ProductCategory)}
            className={`px-2 py-2 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center text-xs ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getIcon(category.icon)}
            <span className="mt-1 text-center">{category.name}</span>
          </button>
        ))}
      </div>
      
      {/* Desktop: Price Range Presets */}
      <div className="hidden md:block mt-6">
        <button
          onClick={() => setShowDesktopPriceFilters(!showDesktopPriceFilters)}
          className={`flex items-center space-x-2 text-base font-medium mb-3 ${activePriceRange ? 'text-purple-600' : 'text-gray-700'}`}
        >
          <Filter className="w-5 h-5" />
          <span>Filtrer par prix</span>
          {showDesktopPriceFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {activePriceRange && (
            <span className="bg-purple-100 text-purple-700 text-sm px-2 py-0.5 rounded-full ml-2">Actif</span>
          )}
        </button>
        
        {showDesktopPriceFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {priceRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => onPriceRangeSelect && onPriceRangeSelect(range.min, range.max)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isPriceRangeActive(range.min, range.max)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile: Price Range Presets */}
      <div className="mt-4 md:hidden">
        <button
          onClick={() => setShowPriceFilters(!showPriceFilters)}
          className={`flex items-center space-x-2 text-sm font-medium mb-2 ${activePriceRange ? 'text-purple-600' : 'text-gray-700'}`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtrer par prix</span>
          <span className="text-xs">{showPriceFilters ? '▲' : '▼'}</span>
          {activePriceRange && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full ml-2">Actif</span>
          )}
        </button>
        
        {showPriceFilters && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {priceRanges.map((range, index) => (
              <button
                key={index}
                onClick={() => onPriceRangeSelect && onPriceRangeSelect(range.min, range.max)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isPriceRangeActive(range.min, range.max)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
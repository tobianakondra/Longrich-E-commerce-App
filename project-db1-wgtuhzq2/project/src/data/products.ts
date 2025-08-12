import { Product } from '../types';

// Tableau de produits vide (les produits seront chargés depuis Firestore)
export const products: Product[] = [];

export const categories = [
  { id: 'health', name: 'Santé', icon: 'Heart' },
  { id: 'body-care', name: 'Soins du corps', icon: 'Sparkles' },
  { id: 'face-care', name: 'Soins du visage', icon: 'Smile' },
  { id: 'beauty', name: 'Beauté', icon: 'Palette' },
  { id: 'wellness', name: 'Bien-être', icon: 'Leaf' }
];
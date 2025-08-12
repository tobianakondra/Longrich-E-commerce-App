import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { Product, AdminProductForm } from '../types';
//import { products as initialProducts } from '../data/products';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AdminContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: AdminProductForm) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleFeatured: (id: string) => Promise<void>;
  toggleSpecialOffer: (id: string, discount?: number) => Promise<void>;
  updatePrice: (id: string, price: number, originalPrice?: number) => Promise<void>;
  getFeaturedProducts: () => Product[];
  getSpecialOffers: () => Product[];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les produits depuis Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        
        if (productsSnapshot.empty) {
          console.log('Aucun produit trouvé dans Firestore, utilisation des produits par défaut');
          // Si aucun produit n'existe dans Firestore, utiliser les produits par défaut
          // et les ajouter à Firestore
          /* const defaultProducts = await Promise.all(initialProducts.map(async (product) => {
            const docRef = await addDoc(collection(db, 'products'), product);
            return { ...product, id: docRef.id };
          })); */
          // setProducts(defaultProducts);
        } else {
          const productsData = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        // En cas d'erreur, utiliser les produits par défaut
        //setProducts(initialProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addProduct = async (productForm: AdminProductForm): Promise<string> => {
    try {
      // Nettoyer les valeurs undefined (Firestore ne les accepte pas)
      const cleanedProduct = Object.fromEntries(
        Object.entries(productForm).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'products'), cleanedProduct);
      const newProduct: Product = {
        ...productForm,
        id: docRef.id,
      };
      setProducts(prev => [...prev, newProduct]);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    try {
      // Nettoyer les valeurs undefined
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, cleanedUpdates);
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? { ...product, ...updates } : product
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  };

  const toggleFeatured = async (id: string): Promise<void> => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      const productRef = doc(db, 'products', id);
      const featured = !product.featured;
      await updateDoc(productRef, { featured });
      
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? { ...product, featured } : product
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut vedette:', error);
      throw error;
    }
  };

  const toggleSpecialOffer = async (id: string, discount?: number): Promise<void> => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      const productRef = doc(db, 'products', id);
      
      if (product.discount) {
        // Retirer l'offre spéciale
        const updates = {
          discount: null,
          originalPrice: null
        };
        await updateDoc(productRef, updates);
        
        const { discount: _d, originalPrice: _o, ...productWithoutDiscount } = product;
        setProducts(prev =>
          prev.map(p => p.id === id ? productWithoutDiscount : p)
        );
      } else {
        // Ajouter l'offre spéciale
        const originalPrice = product.originalPrice || product.price;
        const discountPercent = discount || 20;
        const newPrice = Math.round(originalPrice * (1 - discountPercent / 100));
        
        const updates = {
          price: newPrice,
          originalPrice,
          discount: discountPercent
        };
        
        await updateDoc(productRef, updates);
        
        setProducts(prev =>
          prev.map(p => p.id === id ? { ...p, ...updates } : p)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'offre spéciale:', error);
      throw error;
    }
  };

  const updatePrice = async (id: string, price: number, originalPrice?: number): Promise<void> => {
    try {
      const productRef = doc(db, 'products', id);
      // Créer l'objet de mise à jour et filtrer les valeurs undefined
      const updates = Object.fromEntries(
        Object.entries({ price, originalPrice })
          .filter(([_, value]) => value !== undefined)
      );
      
      await updateDoc(productRef, updates);
      
      setProducts(prev =>
        prev.map(product =>
          product.id === id ? { ...product, ...updates } : product
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error);
      throw error;
    }
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.featured);
  };

  const getSpecialOffers = () => {
    return products.filter(product => product.discount);
  };

  const value = {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleFeatured,
    toggleSpecialOffer,
    updatePrice,
    getFeaturedProducts,
    getSpecialOffers
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
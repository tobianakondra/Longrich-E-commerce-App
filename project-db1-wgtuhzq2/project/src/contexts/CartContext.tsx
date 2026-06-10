import { type FC, createContext, useContext, useEffect, useState, useRef } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { useAdmin } from './AdminContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, onAuthRequired: () => void, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, onAuthRequired: () => void) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, onAuthRequired: () => void) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const { products: allProducts, loading: productsLoading } = useAdmin();
  const hasLoadedRef = useRef(false);

  // Fonction utilitaire pour synchroniser un item avec le catalogue
  const syncItemWithCatalog = (item: CartItem, catalog: Product[]): CartItem => {
    const currentProduct = catalog.find(p => p.id === item.id);
    if (!currentProduct) return item;
    
    const isBase64 = item.image?.startsWith('data:image');
    if (item.price !== currentProduct.price || 
        item.name !== currentProduct.name || 
        item.image !== currentProduct.image ||
        isBase64) {
      return { ...currentProduct, quantity: item.quantity };
    }
    return item;
  };

  // Charger le panier depuis Firestore (Une seule fois au montage/login)
  useEffect(() => {
    const loadCart = async () => {
      if (!currentUser?.uid) {
        setItems([]);
        setIsLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      // Si déjà chargé pour cet utilisateur, on ne recharge pas (évite d'écraser les modifs locales)
      if (hasLoadedRef.current) return;

      try {
        console.log('[Cart] Chargement depuis Firestore...');
        const cartDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (cartDoc.exists() && cartDoc.data().cart) {
          let cloudItems = cartDoc.data().cart as CartItem[];
          
          // Synchroniser immédiatement avec le catalogue si dispo
          if (allProducts.length > 0) {
            cloudItems = cloudItems.map(item => syncItemWithCatalog(item, allProducts));
          }
          
          setItems(cloudItems);
          hasLoadedRef.current = true;
        } else {
          setItems([]);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!productsLoading) {
      loadCart();
    }
  }, [currentUser?.uid, productsLoading, allProducts]);

  // Sauvegarder le panier dans Firestore
  const persistCart = async (newItems: CartItem[]) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        cart: newItems,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Erreur persistence panier:', error);
    }
  };

  const addToCart = async (product: Product, onAuthRequired: () => void, quantity: number = 1) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    setItems(prev => {
      const newItems = [...prev];
      const existingItem = newItems.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        newItems.push({ ...product, quantity });
      }
      
      persistCart(newItems);
      return newItems;
    });
  };

  const removeFromCart = async (productId: string, onAuthRequired: () => void) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    setItems(prev => {
      const newItems = prev.filter(item => item.id !== productId);
      persistCart(newItems);
      return newItems;
    });
  };

  const updateQuantity = async (productId: string, quantity: number, onAuthRequired: () => void) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    setItems(prev => {
      if (quantity <= 0) {
        const newItems = prev.filter(item => item.id !== productId);
        persistCart(newItems);
        return newItems;
      }
      const newItems = prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      persistCart(newItems);
      return newItems;
    });
  };

  const clearCart = async () => {
    if (!currentUser) return;
    setItems([]);
    await persistCart([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isLoading
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

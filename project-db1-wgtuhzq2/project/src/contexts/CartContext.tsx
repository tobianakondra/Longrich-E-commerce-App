import { type FC, createContext, useContext, useEffect, useState } from 'react';
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

  // Charger le panier depuis Firestore (Une seule fois au montage ou changement d'ID utilisateur)
  useEffect(() => {
    const loadCart = async () => {
      if (!currentUser?.uid) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Cart] Chargement initial du panier...');
        const cartDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (cartDoc.exists() && cartDoc.data().cart) {
          const cloudItems = cartDoc.data().cart;
          
          // Nettoyage immédiat des Base64 lors du premier chargement
          const cleanedItems = cloudItems.map((item: any) => {
            const catalogProduct = allProducts.find(p => p.id === item.id);
            if (catalogProduct && item.image?.startsWith('data:image')) {
              return { ...item, image: catalogProduct.image };
            }
            return item;
          });
          
          setItems(cleanedItems);
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
  }, [currentUser?.uid, productsLoading]); // On ne surveille QUE l'UID, pas l'objet complet !

  // Synchroniser le panier avec les données du catalogue (prix, nom, image)
  // Et NETTOYER les anciennes images Base64
  useEffect(() => {
    if (!isLoading && !productsLoading && allProducts.length > 0 && items.length > 0) {
      let hasChanges = false;
      const syncedItems = items.map(item => {
        const currentProduct = allProducts.find(p => p.id === item.id);
        
        // 1. Vérifier si l'image est un ancien format Base64
        const isBase64 = item.image && item.image.startsWith('data:image');
        
        if (currentProduct) {
          // 2. Vérifier si des données critiques ont changé ou si c'est du Base64
          if (item.price !== currentProduct.price || 
              item.name !== currentProduct.name || 
              item.image !== currentProduct.image ||
              isBase64) {
            hasChanges = true;
            return { ...currentProduct, quantity: item.quantity };
          }
        }
        return item;
      });

      if (hasChanges) {
        console.log('[Cart] Synchronisation des prix/images détectée');
        setItems(syncedItems);
        saveCart(syncedItems);
      }
    }
  }, [allProducts, productsLoading, isLoading, items.length]); // Surveiller la taille du panier pour éviter les boucles infinies

  // Sauvegarder le panier dans Firestore
  const saveCart = async (newItems: CartItem[]) => {
    if (!currentUser) return;

    try {
      // Utiliser setDoc avec merge: true pour créer le document s'il n'existe pas
      await setDoc(doc(db, 'users', currentUser.uid), {
        cart: newItems,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('[Cart] Panier sauvegardé dans Firestore');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  };

  const addToCart = async (product: Product, onAuthRequired: () => void, quantity: number = 1) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    const newItems = [...items];
    const existingItem = newItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      newItems.push({ ...product, quantity });
    }

    setItems(newItems);
    await saveCart(newItems);
  };

  const removeFromCart = async (productId: string, onAuthRequired: () => void) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    const newItems = items.filter(item => item.id !== productId);
    setItems(newItems);
    await saveCart(newItems);
  };

  const updateQuantity = async (productId: string, quantity: number, onAuthRequired: () => void) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(productId, onAuthRequired);
      return;
    }

    const newItems = items.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );

    setItems(newItems);
    await saveCart(newItems);
  };

  const clearCart = async () => {
    if (!currentUser) return;

    setItems([]);
    await saveCart([]);
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
      <CartContext.Provider value={value}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </CartContext.Provider>
    );
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
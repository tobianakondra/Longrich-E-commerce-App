import { type FC, createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, onAuthRequired: () => void) => void;
  removeFromCart: (productId: string, onAuthRequired: () => void) => void;
  updateQuantity: (productId: string, quantity: number, onAuthRequired: () => void) => void;
  clearCart: () => void;
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

  // Charger le panier depuis Firestore
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (currentUser) {
          const cartDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (cartDoc.exists() && cartDoc.data().cart) {
            setItems(cartDoc.data().cart);
          }
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [currentUser]);

  // Sauvegarder le panier dans Firestore
  const saveCart = async (newItems: CartItem[]) => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          cart: newItems
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error);
    }
  };

  const addToCart = async (product: Product, onAuthRequired: () => void) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    const newItems = [...items];
    const existingItem = newItems.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newItems.push({ ...product, quantity: 1 });
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
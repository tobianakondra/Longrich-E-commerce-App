import { type FC, createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string, phone?: string, address?: string }) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, password: string, username: string) => {
    try {
      // Création du compte d'authentification Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Mise à jour du profil avec le nom d'utilisateur
      await updateProfile(userCredential.user, {
        displayName: username
      });

      // Création du document utilisateur dans Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: username,
        createdAt: new Date(),
        role: "customer",
        cart: [],
        wishlist: [],
        orders: []
      });

      console.log("Document utilisateur créé avec succès dans Firestore");
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Vérifier si c'est un nouvel utilisateur pour créer son document Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          role: "customer",
          cart: [],
          wishlist: [],
          orders: []
        });
      }
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string, phone?: string, address?: string }) => {
    if (!currentUser) {
      throw new Error('No user is logged in');
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);

      // Mettre à jour le document utilisateur dans Firestore
      await updateDoc(userRef, {
        ...data
      });

      // Mettre à jour le displayName dans Firebase Auth si fourni
      if (data.displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName
        });
      }

      // Mettre à jour l'état local
      setCurrentUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          displayName: data.displayName || prev.displayName,
          phone: data.phone || prev.phone,
          address: data.address || prev.address
        };
      });

      console.log("Profil utilisateur mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            // Si le document existe, utiliser les données de Firestore
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: userData.displayName || user.displayName,
              role: userData.role || "customer",
              phone: userData.phone || "",
              address: userData.address || ""
            });
          } else {
            // Si le document n'existe pas (cas des utilisateurs créés avant cette mise à jour)
            // Créer un document utilisateur basé sur les données d'authentification
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              createdAt: new Date(),
              role: "customer",
              phone: "",
              address: "",
              cart: [],
              wishlist: [],
              orders: []
            });

            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              role: "customer",
              phone: "",
              address: ""
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
          // Fallback aux données d'authentification de base
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    signInWithGoogle,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
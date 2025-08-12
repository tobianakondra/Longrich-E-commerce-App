import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AccessLog } from '../types';

/**
 * Configure un utilisateur comme administrateur avec un code secret
 * Cette fonction ne doit être utilisée que par un administrateur existant
 * @param userId - L'ID de l'utilisateur à configurer comme admin
 * @param secretCode - Le code secret à définir pour l'accès admin
 * @returns Une promesse qui se résout lorsque l'opération est terminée
 */
export const setUserAsAdmin = async (userId: string, secretCode: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("L'utilisateur n'existe pas");
    }
    
    await updateDoc(userRef, {
      role: "admin",
      secretCode: secretCode,
      failedAttempts: 0,
      lastFailedAttempt: null
    });
    
    console.log(`Utilisateur ${userId} configuré comme admin avec succès`);
  } catch (error) {
    console.error("Erreur lors de la configuration de l'utilisateur comme admin:", error);
    throw error;
  }
};

/**
 * Réinitialise le nombre de tentatives échouées d'un utilisateur admin
 * @param userId - L'ID de l'utilisateur admin
 * @returns Une promesse qui se résout lorsque l'opération est terminée
 */
export const resetAdminFailedAttempts = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      failedAttempts: 0,
      lastFailedAttempt: null
    });
    
    console.log(`Tentatives échouées réinitialisées pour l'utilisateur ${userId}`);
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des tentatives échouées:", error);
    throw error;
  }
};

/**
 * Modifie le code secret d'un administrateur
 * @param userId - L'ID de l'utilisateur admin
 * @param newSecretCode - Le nouveau code secret
 * @returns Une promesse qui se résout lorsque l'opération est terminée
 */
export const changeAdminSecretCode = async (userId: string, newSecretCode: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("L'utilisateur n'existe pas");
    }
    
    const userData = userDoc.data();
    if (userData.role !== "admin") {
      throw new Error("L'utilisateur n'est pas un administrateur");
    }
    
    await updateDoc(userRef, {
      secretCode: newSecretCode,
      failedAttempts: 0,
      lastFailedAttempt: null
    });
    
    console.log(`Code secret modifié pour l'administrateur ${userId}`);
  } catch (error) {
    console.error("Erreur lors de la modification du code secret:", error);
    throw error;
  }
};

/**
 * Récupère les journaux d'accès récents
 * @param limit - Nombre maximum de journaux à récupérer
 * @returns Une promesse qui se résout avec les journaux d'accès
 */
export const getRecentAccessLogs = async (limit: number = 50): Promise<AccessLog[]> => {
  // Cette fonction nécessiterait une requête plus complexe avec Firebase
  // Elle pourrait être implémentée avec une Cloud Function pour des raisons de sécurité
  console.warn("Cette fonction doit être implémentée avec une Cloud Function pour des raisons de sécurité");
  return [];
}; 
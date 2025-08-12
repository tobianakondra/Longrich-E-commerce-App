import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Vérifie si un utilisateur est déjà configuré comme administrateur
 * @param userId - L'ID de l'utilisateur à vérifier
 * @returns Une promesse qui se résout avec les informations d'admin ou null si l'utilisateur n'est pas admin
 */
export const checkAdminStatus = async (userId: string): Promise<{isAdmin: boolean; hasSecretCode: boolean} | null> => {
  if (!userId) {
    console.error("L'ID utilisateur est requis");
    return null;
  }

  try {
    console.log(`Vérification du statut administrateur pour l'utilisateur ${userId}...`);
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`L'utilisateur avec l'ID ${userId} n'existe pas dans Firestore`);
      return null;
    }
    
    const userData = userDoc.data();
    const isAdmin = userData.role === "admin";
    const hasSecretCode = !!userData.secretCode;
    
    console.log(`Statut admin: ${isAdmin ? "OUI" : "NON"}`);
    console.log(`Code secret défini: ${hasSecretCode ? "OUI" : "NON"}`);
    
    return { isAdmin, hasSecretCode };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut admin:", error);
    return null;
  }
};

/**
 * Utilitaire pour configurer le premier utilisateur administrateur
 * Cette fonction doit être exécutée manuellement dans la console du navigateur
 * par un développeur pour configurer le premier administrateur
 * 
 * @param userId - L'ID de l'utilisateur à configurer comme admin
 * @param secretCode - Le code secret à définir pour l'accès admin
 */
export const setupFirstAdmin = async (userId: string, secretCode: string): Promise<void> => {
  if (!userId || !secretCode) {
    console.error("L'ID utilisateur et le code secret sont requis");
    return;
  }

  if (secretCode.length < 6) {
    console.error("Le code secret doit contenir au moins 6 caractères");
    return;
  }

  try {
    console.log(`Configuration de l'utilisateur ${userId} comme premier administrateur...`);
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`L'utilisateur avec l'ID ${userId} n'existe pas dans Firestore`);
      return;
    }
    
    // Vérifier si l'utilisateur est déjà admin
    const userData = userDoc.data();
    if (userData.role === "admin") {
      console.log(`L'utilisateur ${userId} est déjà administrateur.`);
      
      if (userData.secretCode) {
        console.log("Un code secret est déjà défini. Voulez-vous le remplacer?");
        console.log("Pour mettre à jour le code secret, utilisez plutôt:");
        console.log(`updateAdminSecretCode("${userId}", "NOUVEAU_CODE_SECRET");`);
        return;
      }
    }
    
    // Mettre à jour le document utilisateur
    await updateDoc(userRef, {
      role: "admin",
      secretCode: secretCode,
      failedAttempts: 0,
      lastFailedAttempt: null
    });
    
    console.log(`✅ Utilisateur ${userId} configuré comme administrateur avec succès!`);
    console.log(`Vous pouvez maintenant vous connecter à l'interface d'administration avec votre code secret: ${secretCode}`);
    console.log("⚠️ IMPORTANT: Notez ce code secret dans un endroit sûr et supprimez-le de la console du navigateur.");
  } catch (error) {
    console.error("Erreur lors de la configuration de l'administrateur:", error);
  }
};

/**
 * Met à jour le code secret d'un administrateur existant
 * @param userId - L'ID de l'utilisateur admin
 * @param newSecretCode - Le nouveau code secret
 */
export const updateAdminSecretCode = async (userId: string, newSecretCode: string): Promise<void> => {
  if (!userId || !newSecretCode) {
    console.error("L'ID utilisateur et le nouveau code secret sont requis");
    return;
  }

  if (newSecretCode.length < 6) {
    console.error("Le code secret doit contenir au moins 6 caractères");
    return;
  }

  try {
    console.log(`Mise à jour du code secret pour l'administrateur ${userId}...`);
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`L'utilisateur avec l'ID ${userId} n'existe pas dans Firestore`);
      return;
    }
    
    const userData = userDoc.data();
    if (userData.role !== "admin") {
      console.error(`L'utilisateur ${userId} n'est pas un administrateur.`);
      console.log("Pour configurer un utilisateur comme administrateur, utilisez setupFirstAdmin()");
      return;
    }
    
    // Mettre à jour le code secret
    await updateDoc(userRef, {
      secretCode: newSecretCode,
      failedAttempts: 0,
      lastFailedAttempt: null
    });
    
    console.log(`✅ Code secret mis à jour avec succès pour l'administrateur ${userId}!`);
    console.log(`Nouveau code secret: ${newSecretCode}`);
    console.log("⚠️ IMPORTANT: Notez ce code secret dans un endroit sûr et supprimez-le de la console du navigateur.");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du code secret:", error);
  }
};

/**
 * Instructions pour utiliser cette fonction dans la console du navigateur:
 * 
 * 1. Connectez-vous à votre application avec le compte que vous souhaitez définir comme administrateur
 * 2. Ouvrez la console du navigateur (F12 ou Ctrl+Shift+I)
 * 3. Copiez et collez le code suivant:
 * 
 * ```
 * // Vérifier si un utilisateur est déjà admin
 * import { checkAdminStatus } from './utils/setupAdmin';
 * checkAdminStatus("USER_ID");
 * 
 * // Configurer un utilisateur comme admin
 * import { setupFirstAdmin } from './utils/setupAdmin';
 * setupFirstAdmin("USER_ID", "YOUR_SECRET_CODE");
 * 
 * // Mettre à jour le code secret d'un admin existant
 * import { updateAdminSecretCode } from './utils/setupAdmin';
 * updateAdminSecretCode("USER_ID", "NEW_SECRET_CODE");
 * ```
 * 
 * 4. Après avoir exécuté cette fonction, vous pourrez accéder à l'interface d'administration
 */ 
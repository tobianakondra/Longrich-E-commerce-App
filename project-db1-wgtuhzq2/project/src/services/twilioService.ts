// Service pour gérer la vérification par SMS avec Twilio
// Ce service est conçu pour être utilisé côté client avec des appels API sécurisés

// Interface pour les réponses de l'API Twilio
interface TwilioResponse {
  success: boolean;
  message: string;
  sid?: string;
  status?: string;
  bypassed?: boolean;
}

// Interface pour la configuration SMS
export interface SmsConfig {
  smsEnabled: boolean;
  timestamp: string;
}

// URL de base du serveur backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Clé pour stocker le token CSRF dans le localStorage
const CSRF_TOKEN_KEY = 'longrich_csrf_token_secure_storage';

/**
 * Récupère un token CSRF du serveur
 * @returns Le token CSRF ou null en cas d'erreur
 */
export const getCsrfToken = async (forceNew = false): Promise<string | null> => {
  try {
    // Si forceNew est true ou si nous n'avons pas de token stocké, demander un nouveau token
    const storedToken = localStorage.getItem(CSRF_TOKEN_KEY);
    if (!forceNew && storedToken) {
      return storedToken;
    }
    
    // Demander un nouveau token
    console.log('Demande d\'un nouveau token CSRF');
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du token CSRF');
    }
    
    const data = await response.json();
    
    // Stocker le token dans le localStorage pour les prochaines requêtes
    if (data.csrfToken) {
      localStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
      console.log('Nouveau token CSRF obtenu:', data.csrfToken);
    }
    
    return data.csrfToken;
  } catch (error) {
    console.error('Erreur lors de la récupération du token CSRF:', error);
    return null;
  }
};

/**
 * Récupère la configuration SMS du serveur
 * @returns La configuration SMS
 */
export const getSmsConfig = async (): Promise<SmsConfig> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sms-config`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la configuration SMS');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration SMS:', error);
    // En cas d'erreur, retourner une configuration par défaut (SMS désactivé)
    return {
      smsEnabled: false,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Envoie un code de vérification au numéro de téléphone spécifié
 * @param phoneNumber Numéro de téléphone au format international (ex: +221771234567)
 */
export const sendVerificationCode = async (phoneNumber: string): Promise<TwilioResponse> => {
  try {
    // Toujours demander un nouveau token CSRF
    const csrfToken = await getCsrfToken(true);
    
    if (!csrfToken) {
      throw new Error('Impossible de récupérer un token CSRF');
    }
    
    console.log('Envoi de la requête avec token CSRF:', csrfToken);
    
    // Nettoyer le numéro pour le format attendu par le serveur (9 chiffres sans préfixe)
    const cleanedPhone = phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');
    // Enlever le préfixe 221 s'il existe
    const localPhone = cleanedPhone.startsWith('221') 
      ? cleanedPhone.substring(3) 
      : cleanedPhone;
    
    console.log('Numéro de téléphone envoyé:', localPhone);
    
    // Appel à l'API backend qui gère l'interaction avec Twilio
    const response = await fetch(`${API_BASE_URL}/api/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      body: JSON.stringify({ phoneNumber: localPhone }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Erreur lors de l\'envoi du code');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du code de vérification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi du code'
    };
  }
};

/**
 * Vérifie le code envoyé au numéro de téléphone spécifié
 * @param phoneNumber Numéro de téléphone au format international
 * @param code Code de vérification reçu par SMS
 */
export const verifyCode = async (phoneNumber: string, code: string): Promise<TwilioResponse> => {
  try {
    // Toujours demander un nouveau token CSRF
    const csrfToken = await getCsrfToken(true);
    
    if (!csrfToken) {
      throw new Error('Impossible de récupérer un token CSRF');
    }
    
    // Nettoyer le numéro pour le format attendu par le serveur (9 chiffres sans préfixe)
    const cleanedPhone = phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');
    // Enlever le préfixe 221 s'il existe
    const localPhone = cleanedPhone.startsWith('221') 
      ? cleanedPhone.substring(3) 
      : cleanedPhone;
    
    // Appel à l'API backend qui gère la vérification du code
    const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      body: JSON.stringify({ phoneNumber: localPhone, code }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Erreur lors de la vérification du code');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la vérification du code',
      status: 'error'
    };
  }
};

/**
 * Formate un numéro de téléphone sénégalais pour l'API Twilio
 * @param phoneNumber Numéro de téléphone local (ex: 771234567)
 * @returns Numéro de téléphone au format international (ex: +221771234567)
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Nettoyer le numéro (supprimer espaces, tirets, etc.)
  const cleaned = phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');
  
  // Si le numéro commence déjà par le code pays, le retourner tel quel
  if (cleaned.startsWith('221')) {
    return '+' + cleaned;
  }
  
  // Ajouter le code pays du Sénégal (+221)
  return '+221' + cleaned;
};

/**
 * Valide un numéro de téléphone sénégalais
 * @param phoneNumber Numéro de téléphone à valider
 * @returns true si le numéro est valide, false sinon
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Nettoyer le numéro (supprimer espaces, tirets, etc.)
  const cleaned = phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');
  
  // Vérifier que le numéro commence par 77, 78, 76, 70 ou 75 et a exactement 9 chiffres
  const regex = /^(77|78|76|70|75)[0-9]{7}$/;
  
  return regex.test(cleaned) && cleaned.length === 9;
}; 
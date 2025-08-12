import { SmsConfig } from '../hooks/useSmsConfig';

// URL de base du serveur backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Clé pour stocker la configuration dans le localStorage
const SMS_CONFIG_CACHE_KEY = 'lb6a2f49c8d134ee6a86b591ceca1f8ffef6e0b4dfc8c2f53e429c2fd1a5b45c1';
// Durée de validité du cache en millisecondes (1 heure)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Vérifie la configuration SMS
 * @returns La configuration SMS
 */
export const checkSmsConfig = async (): Promise<SmsConfig> => {
  try {
    // Vérifier d'abord le cache
    const cachedConfig = getFromCache();
    if (cachedConfig) {
      console.log('Configuration SMS récupérée depuis le cache');
      return cachedConfig;
    }

    // Si pas de cache valide, récupérer depuis le serveur
    console.log('Récupération de la configuration SMS depuis le serveur');
    const response = await fetch(`${API_BASE_URL}/api/sms-config`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la configuration SMS');
    }
    
    const data = await response.json();
    
    // Mettre à jour le cache
    updateCache(data);
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la vérification de la configuration SMS:', error);
    // En cas d'erreur, retourner une configuration par défaut (SMS désactivé)
    return {
      smsEnabled: false,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Récupère la configuration depuis le cache
 */
const getFromCache = (): SmsConfig | null => {
  const cached = localStorage.getItem(SMS_CONFIG_CACHE_KEY);
  if (!cached) return null;

  try {
    const parsedCache = JSON.parse(cached);
    const now = Date.now();
    const timestamp = new Date(parsedCache.timestamp).getTime();

    // Vérifier si le cache est encore valide
    if (now - timestamp < CACHE_DURATION) {
      return parsedCache;
    }
    
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Met à jour le cache avec la nouvelle configuration
 */
const updateCache = (config: SmsConfig): void => {
  localStorage.setItem(SMS_CONFIG_CACHE_KEY, JSON.stringify(config));
}; 
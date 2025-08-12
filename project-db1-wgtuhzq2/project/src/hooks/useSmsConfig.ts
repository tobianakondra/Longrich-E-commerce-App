import { useState, useEffect } from 'react';

// Interface pour la configuration SMS
export interface SmsConfig {
  smsEnabled: boolean;
  timestamp: string;
}

// Clé pour stocker la configuration dans le localStorage
const SMS_CONFIG_CACHE_KEY = 'lb6a2f49c8d134ee6a86b591ceca1f8ffef6e0b4dfc8c2f53e429c2fd1a5b45c1';
// Durée de validité du cache en millisecondes (1 heure)
const CACHE_DURATION = 60 * 60 * 1000;

// URL de base du serveur backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Hook personnalisé pour gérer la configuration SMS
 * Récupère la configuration depuis le serveur et la met en cache
 */
export const useSmsConfig = () => {
  const [config, setConfig] = useState<SmsConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer la configuration depuis le cache
  const getFromCache = (): SmsConfig | null => {
    const cached = localStorage.getItem(SMS_CONFIG_CACHE_KEY);
    if (!cached) return null;

    try {
      const parsedCache = JSON.parse(cached);
      const now = Date.now();
      const timestamp = new Date(parsedCache.timestamp).getTime();

      // Vérifier si le cache est encore valide
      if (now - timestamp < CACHE_DURATION) {
        console.log('Configuration SMS récupérée depuis le cache');
        return parsedCache;
      }
      
      console.log('Cache SMS expiré');
      return null;
    } catch (err) {
      //console.error('Erreur lors de la lecture du cache SMS:', err);
      return null;
    }
  };

  // Fonction pour mettre à jour le cache
  const updateCache = (newConfig: SmsConfig) => {
    localStorage.setItem(SMS_CONFIG_CACHE_KEY, JSON.stringify(newConfig));
  };

  // Fonction pour récupérer la configuration depuis le serveur
  const fetchConfig = async (ignoreCache = false) => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier d'abord le cache si on ne l'ignore pas
      if (!ignoreCache) {
        const cachedConfig = getFromCache();
        if (cachedConfig) {
          setConfig(cachedConfig);
          setLoading(false);
          return;
        }
      }

      // Récupérer la configuration depuis le serveur
      const response = await fetch(`${API_BASE_URL}/api/sms-config`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();
      
      // Mettre à jour le cache et l'état
      updateCache(data);
      setConfig(data);
    } catch (err) {
      console.error('Erreur lors de la récupération de la configuration SMS:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // En cas d'erreur, utiliser une configuration par défaut (SMS désactivé)
      const fallbackConfig: SmsConfig = {
        smsEnabled: false,
        timestamp: new Date().toISOString()
      };
      
      setConfig(fallbackConfig);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la configuration au chargement du composant
  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: () => fetchConfig(true)
  };
};

export default useSmsConfig; 
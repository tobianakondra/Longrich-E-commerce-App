/**
 * Script pour configurer les paramètres de cache Cloudflare pour les ressources statiques
 * 
 * Ce script utilise l'API Cloudflare pour configurer les paramètres de cache
 * pour les ressources statiques sous le chemin `/static/*`.
 * 
 * Prérequis:
 * - Node.js installé
 * - Clé API Cloudflare et Email ou Token d'API
 * - Zone ID Cloudflare pour le domaine
 * 
 * Usage:
 * 1. Installez les dépendances: npm install node-fetch dotenv
 * 2. Configurez les variables d'environnement dans le fichier .env
 * 3. Exécutez le script: node configure-cache.js
 */

const fetch = require('node-fetch');
require('dotenv').config();

// Configuration
const config = {
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  zoneId: process.env.CLOUDFLARE_ZONE_ID
};

// Vérifier la configuration
if ((!config.apiKey || !config.email) && !config.apiToken) {
  console.error('Erreur: Vous devez fournir soit une clé API et un email, soit un token API.');
  process.exit(1);
}

if (!config.zoneId) {
  console.error('Erreur: Vous devez fournir un ID de zone Cloudflare.');
  process.exit(1);
}

/**
 * Configure les paramètres de cache Cloudflare
 */
async function configureCacheSettings() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/settings/cache_level`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}`, 'Content-Type': 'application/json' }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey, 'Content-Type': 'application/json' };
  
  // Définir les paramètres de cache
  const cacheSettings = {
    value: 'aggressive'
  };
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(cacheSettings)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la configuration des paramètres de cache:', data.errors);
      process.exit(1);
    }
    
    console.log('Paramètres de cache configurés avec succès:', data.result);
    return data.result;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    process.exit(1);
  }
}

/**
 * Configure le TTL du cache navigateur
 */
async function configureBrowserCacheTTL() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/settings/browser_cache_ttl`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}`, 'Content-Type': 'application/json' }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey, 'Content-Type': 'application/json' };
  
  // Définir le TTL du cache navigateur (14400 = 4 heures)
  const browserCacheTTL = {
    value: 14400
  };
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(browserCacheTTL)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la configuration du TTL du cache navigateur:', data.errors);
      process.exit(1);
    }
    
    console.log('TTL du cache navigateur configuré avec succès:', data.result);
    return data.result;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    process.exit(1);
  }
}

/**
 * Crée une règle de cache pour les ressources statiques
 */
async function createCacheRule() {
  // Note: La création de règles de cache personnalisées nécessite généralement
  // l'utilisation des règles de page, qui ont déjà été configurées dans create-page-rule.js.
  // Cette fonction est incluse ici pour référence, mais elle n'est pas nécessaire
  // si les règles de page sont déjà configurées.
  
  console.log('Les règles de cache pour les ressources statiques sont configurées via les règles de page.');
  console.log('Veuillez exécuter le script create-page-rule.js si ce n\'est pas déjà fait.');
}

// Exécuter les fonctions principales
async function main() {
  await configureCacheSettings();
  await configureBrowserCacheTTL();
  await createCacheRule();
}

main()
  .then(() => console.log('Configuration du cache terminée avec succès.'))
  .catch(error => console.error('Erreur:', error));
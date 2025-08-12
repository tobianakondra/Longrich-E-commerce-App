/**
 * Script pour créer une règle de page Cloudflare pour les ressources statiques
 * 
 * Ce script utilise l'API Cloudflare pour créer une règle de page qui autorise
 * les requêtes vers les ressources statiques sous le chemin `/static/*`.
 * 
 * Prérequis:
 * - Node.js installé
 * - Clé API Cloudflare et Email ou Token d'API
 * - Zone ID Cloudflare pour le domaine
 * 
 * Usage:
 * 1. Installez les dépendances: npm install node-fetch
 * 2. Configurez les variables d'environnement:
 *    - CLOUDFLARE_API_KEY: Votre clé API Cloudflare
 *    - CLOUDFLARE_EMAIL: Votre email Cloudflare (si vous utilisez une clé API)
 *    - CLOUDFLARE_API_TOKEN: Votre token API Cloudflare (alternative à la clé API + email)
 *    - CLOUDFLARE_ZONE_ID: L'ID de zone pour votre domaine
 * 3. Exécutez le script: node create-page-rule.js
 */

const fetch = require('node-fetch');

// Configuration
const config = {
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
  domain: process.env.DOMAIN || 'longrich.online'
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
 * Crée une règle de page Cloudflare
 */
async function createPageRule() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/pagerules`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}`, 'Content-Type': 'application/json' }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey, 'Content-Type': 'application/json' };
  
  // Définir la règle de page
  const pageRule = {
    targets: [
      {
        target: 'url',
        constraint: {
          operator: 'matches',
          value: `*${config.domain}/static/*`
        }
      }
    ],
    actions: [
      {
        id: 'security_level',
        value: 'essentially_off'
      },
      {
        id: 'cache_level',
        value: 'cache_everything'
      },
      {
        id: 'edge_cache_ttl',
        value: 2592000 // 30 jours en secondes
      },
      {
        id: 'browser_cache_ttl',
        value: 2592000 // 30 jours en secondes
      },
      {
        id: 'disable_apps',
        value: 'on'
      },
      {
        id: 'disable_railgun',
        value: 'on'
      }
    ],
    status: 'active',
    priority: 1 // Priorité élevée
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(pageRule)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la création de la règle de page:', data.errors);
      process.exit(1);
    }
    
    console.log('Règle de page créée avec succès:', data.result);
    return data.result;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
createPageRule()
  .then(() => console.log('Opération terminée avec succès.'))
  .catch(error => console.error('Erreur:', error));
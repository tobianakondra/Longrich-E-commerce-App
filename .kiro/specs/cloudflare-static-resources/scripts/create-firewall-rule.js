/**
 * Script pour créer une règle de pare-feu Cloudflare pour les ressources statiques
 * 
 * Ce script utilise l'API Cloudflare pour créer une règle de pare-feu qui autorise
 * explicitement les requêtes vers les ressources statiques sous le chemin `/static/*`.
 * 
 * Prérequis:
 * - Node.js installé
 * - Clé API Cloudflare et Email ou Token d'API
 * - Zone ID Cloudflare pour le domaine
 * 
 * Usage:
 * 1. Installez les dépendances: npm install node-fetch
 * 2. Configurez les variables d'environnement dans le fichier .env
 * 3. Exécutez le script: node create-firewall-rule.js
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
 * Crée une règle de pare-feu Cloudflare
 */
async function createFirewallRule() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/firewall/rules`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}`, 'Content-Type': 'application/json' }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey, 'Content-Type': 'application/json' };
  
  // Définir la règle de pare-feu
  const firewallRule = {
    filter: {
      expression: '(http.request.uri.path contains "/static/")',
      paused: false
    },
    action: 'allow',
    priority: 1, // Priorité élevée
    description: 'Allow Static Resources',
    paused: false
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(firewallRule)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la création de la règle de pare-feu:', data.errors);
      process.exit(1);
    }
    
    console.log('Règle de pare-feu créée avec succès:', data.result);
    return data.result;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    process.exit(1);
  }
}

// Exécuter la fonction principale
createFirewallRule()
  .then(() => console.log('Opération terminée avec succès.'))
  .catch(error => console.error('Erreur:', error));
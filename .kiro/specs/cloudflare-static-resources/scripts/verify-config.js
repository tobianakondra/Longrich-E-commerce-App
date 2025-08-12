/**
 * Script pour vérifier la configuration Cloudflare pour les ressources statiques
 * 
 * Ce script vérifie que la configuration Cloudflare pour les ressources statiques
 * a été correctement appliquée.
 * 
 * Prérequis:
 * - Node.js installé
 * - Clé API Cloudflare et Email ou Token d'API
 * - Zone ID Cloudflare pour le domaine
 * 
 * Usage:
 * 1. Installez les dépendances: npm install node-fetch dotenv
 * 2. Configurez les variables d'environnement dans le fichier .env
 * 3. Exécutez le script: node verify-config.js
 */

const fetch = require('node-fetch');
require('dotenv').config();

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
 * Vérifie les règles de page
 */
async function verifyPageRules() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/pagerules`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}` }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey };
  
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la récupération des règles de page:', data.errors);
      return false;
    }
    
    // Rechercher une règle de page pour les ressources statiques
    const staticResourceRule = data.result.find(rule => {
      const target = rule.targets && rule.targets[0];
      return target && target.constraint && target.constraint.value && 
             target.constraint.value.includes('/static/');
    });
    
    if (!staticResourceRule) {
      console.error('Aucune règle de page trouvée pour les ressources statiques.');
      return false;
    }
    
    console.log('Règle de page pour les ressources statiques trouvée:', staticResourceRule);
    
    // Vérifier les actions de la règle
    const securityLevelAction = staticResourceRule.actions.find(action => action.id === 'security_level');
    const cacheLevelAction = staticResourceRule.actions.find(action => action.id === 'cache_level');
    
    if (!securityLevelAction || securityLevelAction.value !== 'essentially_off') {
      console.error('La règle de page n\'a pas le niveau de sécurité correct.');
      return false;
    }
    
    if (!cacheLevelAction || cacheLevelAction.value !== 'cache_everything') {
      console.error('La règle de page n\'a pas le niveau de cache correct.');
      return false;
    }
    
    console.log('La règle de page est correctement configurée.');
    return true;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    return false;
  }
}

/**
 * Vérifie les règles de pare-feu
 */
async function verifyFirewallRules() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/firewall/rules`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}` }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey };
  
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la récupération des règles de pare-feu:', data.errors);
      return false;
    }
    
    // Rechercher une règle de pare-feu pour les ressources statiques
    const staticResourceRule = data.result.find(rule => {
      return rule.filter && rule.filter.expression && 
             rule.filter.expression.includes('/static/') &&
             rule.action === 'allow';
    });
    
    if (!staticResourceRule) {
      console.error('Aucune règle de pare-feu trouvée pour les ressources statiques.');
      return false;
    }
    
    console.log('Règle de pare-feu pour les ressources statiques trouvée:', staticResourceRule);
    console.log('La règle de pare-feu est correctement configurée.');
    return true;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    return false;
  }
}

/**
 * Vérifie les paramètres de cache
 */
async function verifyCacheSettings() {
  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/settings/cache_level`;
  
  // Définir les en-têtes d'authentification
  const headers = config.apiToken
    ? { 'Authorization': `Bearer ${config.apiToken}` }
    : { 'X-Auth-Email': config.email, 'X-Auth-Key': config.apiKey };
  
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!data.success) {
      console.error('Erreur lors de la récupération des paramètres de cache:', data.errors);
      return false;
    }
    
    console.log('Paramètres de cache:', data.result);
    
    // Vérifier que le niveau de cache est approprié
    if (data.result.value !== 'aggressive' && data.result.value !== 'standard') {
      console.error('Le niveau de cache n\'est pas configuré de manière optimale.');
      return false;
    }
    
    console.log('Les paramètres de cache sont correctement configurés.');
    return true;
  } catch (error) {
    console.error('Erreur lors de la requête à l\'API Cloudflare:', error);
    return false;
  }
}

/**
 * Vérifie l'accès aux ressources statiques
 */
async function verifyStaticResourceAccess() {
  // Cette fonction simule une requête vers une ressource statique
  // et vérifie qu'elle est accessible
  
  // Note: Cette vérification est limitée car elle ne peut pas simuler
  // exactement le comportement du navigateur. Une vérification manuelle
  // est recommandée en complément.
  
  const testUrl = `https://${config.domain}/static/test.png`;
  
  try {
    console.log(`Tentative d'accès à ${testUrl}...`);
    const response = await fetch(testUrl);
    
    console.log('Code de statut:', response.status);
    console.log('En-têtes:', Object.fromEntries(response.headers));
    
    if (response.status === 200 || response.status === 304) {
      console.log('La ressource statique est accessible.');
      return true;
    } else if (response.status === 404) {
      console.log('La ressource statique n\'existe pas, mais l\'accès n\'est pas bloqué.');
      return true;
    } else if (response.status === 403) {
      console.error('L\'accès à la ressource statique est bloqué (403 Forbidden).');
      return false;
    } else {
      console.error(`Réponse inattendue: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la requête à la ressource statique:', error);
    return false;
  }
}

// Exécuter les fonctions de vérification
async function main() {
  console.log('Vérification de la configuration Cloudflare pour les ressources statiques...');
  
  const pageRulesOk = await verifyPageRules();
  const firewallRulesOk = await verifyFirewallRules();
  const cacheSettingsOk = await verifyCacheSettings();
  const staticResourceAccessOk = await verifyStaticResourceAccess();
  
  console.log('\nRésumé de la vérification:');
  console.log(`- Règles de page: ${pageRulesOk ? '✅ OK' : '❌ NON'}`);
  console.log(`- Règles de pare-feu: ${firewallRulesOk ? '✅ OK' : '❌ NON'}`);
  console.log(`- Paramètres de cache: ${cacheSettingsOk ? '✅ OK' : '❌ NON'}`);
  console.log(`- Accès aux ressources statiques: ${staticResourceAccessOk ? '✅ OK' : '❌ NON'}`);
  
  if (pageRulesOk && firewallRulesOk && cacheSettingsOk && staticResourceAccessOk) {
    console.log('\n✅ La configuration Cloudflare est correcte.');
    return true;
  } else {
    console.error('\n❌ La configuration Cloudflare présente des problèmes.');
    return false;
  }
}

main()
  .then(result => {
    if (!result) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Erreur:', error);
    process.exit(1);
  });
/**
 * Script pour configurer toutes les règles Cloudflare pour les ressources statiques
 * 
 * Ce script exécute tous les scripts de configuration en séquence pour
 * configurer Cloudflare afin d'autoriser les requêtes vers les ressources statiques.
 * 
 * Prérequis:
 * - Node.js installé
 * - Clé API Cloudflare et Email ou Token d'API
 * - Zone ID Cloudflare pour le domaine
 * 
 * Usage:
 * 1. Installez les dépendances: npm install node-fetch dotenv
 * 2. Configurez les variables d'environnement dans le fichier .env
 * 3. Exécutez le script: node configure-all.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Liste des scripts à exécuter
const scripts = [
  'create-page-rule.js',
  'create-firewall-rule.js',
  'configure-cache.js',
  'verify-config.js'
];

/**
 * Exécute un script Node.js
 */
async function runScript(scriptName) {
  console.log(`\n=== Exécution de ${scriptName} ===\n`);
  
  try {
    const { stdout, stderr } = await execPromise(`node ${scriptName}`);
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error(stderr);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'exécution de ${scriptName}:`, error.message);
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return false;
  }
}

/**
 * Exécute tous les scripts en séquence
 */
async function main() {
  console.log('Configuration de Cloudflare pour les ressources statiques...');
  
  let allSuccessful = true;
  
  for (const script of scripts) {
    const success = await runScript(script);
    if (!success) {
      allSuccessful = false;
      console.error(`\n❌ Échec de l'exécution de ${script}`);
      
      // Demander à l'utilisateur s'il souhaite continuer
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\nVoulez-vous continuer avec les scripts suivants? (o/n) ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'oui') {
        console.log('Configuration interrompue.');
        process.exit(1);
      }
    }
  }
  
  if (allSuccessful) {
    console.log('\n✅ Configuration de Cloudflare terminée avec succès.');
  } else {
    console.error('\n⚠️ Configuration de Cloudflare terminée avec des erreurs.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
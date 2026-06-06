#!/usr/bin/env node

/**
 * Script de démarrage unifié pour le serveur de paiement Longrich
 * Ce script effectue toutes les vérifications nécessaires et démarre le serveur
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Obtenir le chemin du répertoire actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins des fichiers
const serverPath = path.join(__dirname, 'server.js');
const serviceDir = path.join(__dirname, 'services');
const paymentServicePath = path.join(serviceDir, 'paymentService.js');
const sslDir = path.join(__dirname, 'ssl');
const sslCertPath = path.join(sslDir, 'cert.pem');
const sslKeyPath = path.join(sslDir, 'key.pem');

console.log('\x1b[36m%s\x1b[0m', '🔍 Vérification de l\'environnement du serveur de paiement...');

// Vérifier que le répertoire services existe
if (!fs.existsSync(serviceDir)) {
  console.log('Création du répertoire services...');
  fs.mkdirSync(serviceDir, { recursive: true });
}

// Vérifier que le service de paiement existe
if (!fs.existsSync(paymentServicePath)) {
  console.error('\x1b[31m%s\x1b[0m', 'ERREUR: Le service de paiement est introuvable!');
  console.error('\x1b[33m%s\x1b[0m', `Veuillez vous assurer que le fichier existe: ${paymentServicePath}`);
  process.exit(1);
}

// Vérifier que le serveur existe
if (!fs.existsSync(serverPath)) {
  console.error('\x1b[31m%s\x1b[0m', 'ERREUR: Le fichier server.js est introuvable!');
  process.exit(1);
}

// Vérifier les certificats SSL
if (!fs.existsSync(sslCertPath) || !fs.existsSync(sslKeyPath)) {
  console.warn('\x1b[33m%s\x1b[0m', 'ATTENTION: Certificats SSL non trouvés!');
  console.warn('\x1b[33m%s\x1b[0m', 'Le serveur HTTPS ne pourra pas démarrer.');
  console.warn('\x1b[33m%s\x1b[0m', `Assurez-vous que les fichiers existent dans: ${sslDir}`);
} else {
  console.log('\x1b[32m%s\x1b[0m', '✓ Certificats SSL trouvés');
}

// Vérifier la présence du fichier .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.warn('\x1b[33m%s\x1b[0m', 'ATTENTION: Fichier .env non trouvé!');
  console.warn('\x1b[33m%s\x1b[0m', 'Créez un fichier .env basé sur .env.example avec vos clés API');
}

// Vérifier les dépendances réseau
console.log('Vérification des dépendances réseau...');
try {
  execSync('ping -c 1 api.sene-pay.com', { stdio: 'ignore' });
  console.log('\x1b[32m%s\x1b[0m', '✓ Connexion à SenePay disponible');
} catch (error) {
  console.warn('\x1b[33m%s\x1b[0m', 'ATTENTION: Impossible de se connecter à api.sene-pay.com');
}

// Vérifier les clés API SenePay
const requiredEnvVars = ['SENEPAY_API_KEY', 'SENEPAY_API_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'ERREUR: Variables d\'environnement manquantes:');
  missingVars.forEach(varName => {
    console.error('\x1b[31m%s\x1b[0m', `  - ${varName}`);
  });
  console.error('\x1b[33m%s\x1b[0m', 'Veuillez définir ces variables dans le fichier .env');
  process.exit(1);
}

// Démarrer le serveur
console.log('\x1b[36m%s\x1b[0m', '🚀 Démarrage du serveur de paiement sécurisé...');

// Définir le port
const PORT = process.env.PORT || 4000;
const HTTPS_PORT = PORT + 1;
console.log(`\x1b[33m%s\x1b[0m`, `Port HTTP configuré: ${PORT}`);
console.log(`\x1b[33m%s\x1b[0m`, `Port HTTPS configuré: ${HTTPS_PORT}`);

// Démarrer le serveur
try {
  // Importer et exécuter le serveur
  import('./server.js')
    .catch(error => {
      console.error('\x1b[31m%s\x1b[0m', `ERREUR lors du démarrage du serveur: ${error.message}`);
      process.exit(1);
    });
  
  console.log('\x1b[32m%s\x1b[0m', `✓ Serveur HTTP disponible sur http://localhost:${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', `✓ Serveur HTTPS disponible sur https://localhost:${HTTPS_PORT}`);
  console.log('\x1b[33m%s\x1b[0m', 'Appuyez sur Ctrl+C pour arrêter le serveur');
  
  // Gérer l'arrêt propre du serveur
  process.on('SIGINT', () => {
    console.log('\n\x1b[33m%s\x1b[0m', 'Arrêt du serveur de paiement...');
    process.exit(0);
  });
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', `ERREUR: Impossible de démarrer le serveur: ${error.message}`);
  process.exit(1);
} 
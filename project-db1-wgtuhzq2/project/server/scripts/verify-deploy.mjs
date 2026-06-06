#!/usr/bin/env node

/**
 * Script de vérification avant déploiement
 * Lancez: node scripts/verify-deploy.mjs
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const DIST_PATH = path.join(PROJECT_ROOT, 'dist');
const SERVER_PATH = path.join(PROJECT_ROOT, 'server');
const INDEX_HTML = path.join(DIST_PATH, 'index.html');

console.log('\n🔍 Vérification pré-déploiement Longrich\n');

let errors = 0;

// 1. Vérifier que le build existe
if (!fs.existsSync(DIST_PATH)) {
  console.error('❌ dossier dist/ introuvable. Lancez: npm run build');
  errors++;
} else {
  console.log('✅ dist/ existe');
}

// 2. Vérifier index.html
if (!fs.existsSync(INDEX_HTML)) {
  console.error('❌ dist/index.html introuvable');
  errors++;
} else {
  const content = fs.readFileSync(INDEX_HTML, 'utf8');
  if (content.includes('<div id="root">') || content.includes('<div id="root"')) {
    console.log('✅ dist/index.html contient le div root');
  } else {
    console.warn('⚠️  dist/index.html ne contient pas <div id="root">');
  }
}

// 3. Vérifier que le serveur peut trouver dist/
const serverJs = path.join(SERVER_PATH, 'server.js');
if (fs.existsSync(serverJs)) {
  const content = fs.readFileSync(serverJs, 'utf8');
  if (content.includes("path.join(__dirname, '../dist')")) {
    console.log('✅ server.js pointe vers ../dist');
  } else {
    console.error('❌ server.js ne pointe pas vers ../dist');
    errors++;
  }
}

// 4. Vérifier que les fichiers de config existent
const serviceFile = path.join(SERVER_PATH, 'deployment/systemd/longrich.service');
const nginxFile = path.join(SERVER_PATH, 'deployment/nginx/longrich.conf');

if (fs.existsSync(serviceFile)) {
  console.log('✅ Fichier systemd présent');
} else {
  console.error('❌ Fichier systemd manquant');
  errors++;
}

if (fs.existsSync(nginxFile)) {
  console.log('✅ Fichier nginx présent');
} else {
  console.error('❌ Fichier nginx manquant');
  errors++;
}

// Résultat
console.log('\n' + '-'.repeat(40));
if (errors === 0) {
  console.log('🚀 Prêt pour le déploiement !');
  console.log('   Prochaine étape: rsync vers le serveur Ubuntu');
  process.exit(0);
} else {
  console.log(`⚠️  ${errors} problème(s) à corriger`);
  process.exit(1);
}

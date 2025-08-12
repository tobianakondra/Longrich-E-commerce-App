#!/usr/bin/env node

/**
 * Script post-build pour optimiser les fichiers de production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

// Fonction pour minifier les fichiers HTML
function minifyHtml(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Supprimer les commentaires HTML (sauf les commentaires conditionnels IE)
    content = content.replace(/<!--(?![\s\S]*?\[if[\s\S]*?endif\])[\s\S]*?-->/g, '');
    
    // Supprimer les espaces multiples
    content = content.replace(/\s{2,}/g, ' ');
    
    // Supprimer les espaces autour des balises
    content = content.replace(/>\s+</g, '><');
    
    fs.writeFileSync(filePath, content);
    console.log(`Minified HTML: ${filePath}`);
  } catch (error) {
    console.error(`Error minifying ${filePath}:`, error);
  }
}

// Fonction pour optimiser les fichiers JS
function optimizeJs(filePath) {
  try {
    // Vérifier si c'est un fichier JS
    if (!filePath.endsWith('.js')) return;
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier la taille du fichier
    const sizeInMB = content.length / (1024 * 1024);
    console.log(`JS file size: ${filePath} - ${sizeInMB.toFixed(2)} MB`);
    
    // Si le fichier est trop gros, ajouter un commentaire pour suggérer le code splitting
    if (sizeInMB > 0.5) {
      console.warn(`WARNING: Large JS file detected: ${filePath} (${sizeInMB.toFixed(2)} MB)`);
      console.warn('Consider using code splitting to improve performance');
    }
  } catch (error) {
    console.error(`Error optimizing JS ${filePath}:`, error);
  }
}

// Fonction principale
async function main() {
  console.log('Running post-build optimization...');
  
  // Minifier le fichier HTML principal
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    minifyHtml(indexHtmlPath);
  }
  
  // Analyser les fichiers JS pour détecter les problèmes potentiels
  const jsFiles = fs.readdirSync(distDir + '/assets').filter(file => file.endsWith('.js'));
  jsFiles.forEach(file => {
    optimizeJs(path.join(distDir, 'assets', file));
  });
  
  console.log('Post-build optimization completed successfully!');
}

main().catch(error => {
  console.error('Error in post-build script:', error);
  process.exit(1);
}); 
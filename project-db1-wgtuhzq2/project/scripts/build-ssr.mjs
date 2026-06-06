#!/usr/bin/env node

/**
 * Script de build multi-parties pour le SSR
 * Génère à la fois le bundle client ET le bundle serveur
 *
 * Usage: node scripts/build-ssr.mjs
 */

import { build as viteBuild } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(PROJECT_ROOT, 'dist');

console.log('\x1b[36m%s\x1b[0m', '🚀 Build SSR Longrich...');

async function buildClient() {
  console.log('\x1b[33m%s\x1b[0m', '📦 Build client (SPA)...');
  
  await viteBuild({
    root: PROJECT_ROOT,
    build: {
      outDir: path.join(DIST, 'client'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(PROJECT_ROOT, 'index.html'),
      },
      manifest: true,
    },
  });
  
  console.log('\x1b[32m%s\x1b[0m', '✓ Client built');
}

async function buildServer() {
  console.log('\x1b[33m%s\x1b[0m', '📦 Build serveur SSR...');
  
  await viteBuild({
    root: PROJECT_ROOT,
    build: {
      outDir: path.join(DIST, 'server'),
      emptyOutDir: true,
      ssr: {
        noExternal: ['react', 'react-dom', 'react-router-dom'],
      },
      rollupOptions: {
        input: path.join(PROJECT_ROOT, 'src', 'entry-server.tsx'),
        output: {
          entryFileNames: 'entry-server.js',
        },
      },
    },
  });
  
  console.log('\x1b[32m%s\x1b[0m', '✓ Serveur SSR built');
}

function copyPublicAssets() {
  console.log('\x1b[33m%s\x1b[0m', '📋 Copie des assets publics...');
  
  const publicDir = path.join(PROJECT_ROOT, 'public');
  const clientPublicDir = path.join(DIST, 'client', 'public');
  
  if (!fs.existsSync(publicDir)) return;
  
  if (!fs.existsSync(clientPublicDir)) {
    fs.mkdirSync(clientPublicDir, { recursive: true });
  }
  
  fs.readdirSync(publicDir).forEach((file) => {
    const src = path.join(publicDir, file);
    const dst = path.join(clientPublicDir, file);
    if (fs.lstatSync(src).isDirectory()) {
      copyRecursiveSync(src, dst);
    } else {
      fs.copyFileSync(src, dst);
    }
  });
  
  console.log('\x1b[32m%s\x1b[0m', '✓ Assets copiés');
}

function copyRecursiveSync(src: string, dst: string) {
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file);
    const dstPath = path.join(dst, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyRecursiveSync(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  });
}

async function main() {
  try {
    await buildClient();
    await buildServer();
    copyPublicAssets();
    console.log('\x1b[32m%s\x1b[0m', '\n✅ Build SSR terminé !');
    console.log('   dist/client/ → fichiers statiques');
    console.log('   dist/server/ → bundle SSR Node.js');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '\n❌ Erreur lors du build SSR:');
    console.error(error);
    process.exit(1);
  }
}

main();

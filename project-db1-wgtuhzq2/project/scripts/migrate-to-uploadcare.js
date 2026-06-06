import admin from 'firebase-admin';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Fonction maison pour charger le .env sans la bibliothèque dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const UPLOADCARE_PUBLIC_KEY = process.env.VITE_UPLOADCARE_PUBLIC_KEY;
const UPLOADCARE_SECRET_KEY = process.env.UPLOADCARE_SECRET_KEY;

if (!UPLOADCARE_PUBLIC_KEY || !UPLOADCARE_SECRET_KEY) {
  console.error('❌ Erreur: Clés Uploadcare manquantes dans le fichier .env');
  process.exit(1);
}

// Initialisation Firebase Admin
const serviceAccountPath = path.join(__dirname, '../longrich-3212d-7b2897d075b7.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log(`\ud83d\udd11 Tentative de connexion avec: ${serviceAccount.client_email}`);
  console.log(`\ud83d\udcc1 Projet: ${serviceAccount.project_id}`);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
  }
} else {
  console.error('❌ Erreur: Fichier de service account Firebase introuvable');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Upload une image Base64 vers Uploadcare
 */
async function uploadToBase64ToUploadcare(base64Data, fileName) {
  try {
    const base64Content = base64Data.split(',')[1] || base64Data;
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Construction manuelle du corps multipart pour une compatibilité maximale
    const boundary = `----NodeJSBoundary${Math.random().toString(36).substring(2)}`;
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="UPLOADCARE_PUB_KEY"\r\n\r\n${UPLOADCARE_PUBLIC_KEY}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="UPLOADCARE_STORE"\r\n\r\n1\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`
    ];

    const body = Buffer.concat([
      Buffer.from(parts[0]),
      Buffer.from(parts[1]),
      Buffer.from(parts[2]),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const response = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      body: body
    });

    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      if (data.file) {
        // Utilisation de votre URL personnalisée avec préfixe et optimisation
        return `https://15pz83n613.ucarecd.net/${data.file}/-/preview/720x720/-/quality/smart/-/format/auto/`;
      } else {
        console.error(`❌ Réponse Uploadcare (Erreur):`, responseText);
        return null;
      }
    } catch (e) {
      console.error(`❌ Réponse non-JSON reçue: "${responseText.substring(0, 100)}..."`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload vers Uploadcare:`, error);
    return null;
  }
}

/**
 * Script principal de migration
 */
async function migrateImages() {
  console.log('🚀 Démarrage de la migration des images vers Uploadcare...');
  
  try {
    const productsSnapshot = await db.collection('products').get();
    console.log(`\ud83d\udcc1 Trouvé ${productsSnapshot.size} produits à analyser.`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of productsSnapshot.docs) {
      const product = doc.data();
      const image = product.image;

      // Cas 1 : L'image est en Base64 (Migration classique)
      if (image && image.startsWith('data:image/')) {
        console.log(`\u23f3 Migration Base64 pour: ${product.name}...`);
        const newUrl = await uploadToBase64ToUploadcare(image, `product_${doc.id}.jpg`);
        if (newUrl) {
          await doc.ref.update({
            image: newUrl,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationLog: 'Migrated from Base64 to Uploadcare (Fixed URL)'
          });
          console.log(`✅ Succès (Base64): ${product.name} -> ${newUrl}`);
          migratedCount++;
        } else {
          errorCount++;
        }
      } 
      // Cas 2 : L'image est déjà sur Uploadcare mais avec le mauvais domaine (Correction)
      else if (image && image.includes('ucarecdn.com')) {
        console.log(`\ud83d\udd27 Correction de l'URL pour: ${product.name}...`);
        const uuid = image.split('/')[3]; // Extraire l'UUID de l'URL
        const newUrl = `https://15pz83n613.ucarecd.net/${uuid}/-/preview/720x720/-/quality/smart/-/format/auto/`;
        
        await doc.ref.update({
          image: newUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          migrationLog: 'Fixed Uploadcare Domain and added optimizations'
        });
        console.log(`✅ Corrigé: ${product.name} -> ${newUrl}`);
        migratedCount++;
      }
      else {
        console.log(`\u23ed\ufe0f Passé: ${product.name} (Déjà correct ou vide)`);
        skippedCount++;
      }
    }

    console.log('\n--- Résumé de la migration ---');
    console.log(`✅ Produits migrés: ${migratedCount}`);
    console.log(`⏭️ Produits passés: ${skippedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log('------------------------------');

  } catch (error) {
    console.error('❌ Erreur fatale durant la migration:', error);
  } finally {
    process.exit(0);
  }
}

migrateImages();

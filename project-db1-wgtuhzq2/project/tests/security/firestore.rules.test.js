/**
 * Tests pour les règles de sécurité Firestore avec App Check
 * 
 * Ces tests vérifient que les règles de sécurité Firestore fonctionnent correctement
 * avec l'intégration d'App Check.
 */

const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Chemin vers les règles Firestore
const RULES_PATH = path.join(__dirname, '../../firestore.rules');

/**
 * Crée une application de test avec les options spécifiées
 * @param {object} auth Informations d'authentification (null pour non authentifié)
 * @param {boolean} appCheckVerified Si le token App Check est vérifié
 * @returns {object} Application de test
 */
function getTestApp(auth, appCheckVerified = false) {
  return firebase.initializeTestApp({
    projectId: 'test-project',
    auth,
    appCheckToken: appCheckVerified ? { token: 'valid-token', app_check_verified: true } : undefined
  });
}

/**
 * Crée une application admin pour la configuration initiale
 * @returns {object} Application admin
 */
function getAdminApp() {
  return firebase.initializeAdminApp({ projectId: 'test-project' });
}

/**
 * Charge les règles Firestore depuis le fichier
 * @returns {Promise<void>}
 */
async function loadRules() {
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  await firebase.loadFirestoreRules({
    projectId: 'test-project',
    rules
  });
}

describe('Règles de sécurité Firestore avec App Check', () => {
  // Nettoyer avant chaque test
  beforeEach(async () => {
    await firebase.clearFirestoreData({ projectId: 'test-project' });
    await loadRules();
    
    // Configurer des données de test
    const admin = getAdminApp();
    const adminDb = admin.firestore();
    
    // Créer un utilisateur admin
    await adminDb.collection('users').doc('admin-user').set({
      role: 'admin',
      email: 'admin@example.com'
    });
    
    // Créer un utilisateur normal
    await adminDb.collection('users').doc('normal-user').set({
      role: 'user',
      email: 'user@example.com'
    });
    
    // Créer un produit
    await adminDb.collection('products').doc('product1').set({
      name: 'Test Product',
      price: 99.99,
      description: 'A test product'
    });
    
    // Créer une commande
    await adminDb.collection('orders').doc('order1').set({
      userId: 'normal-user',
      total: 99.99,
      items: [{ productId: 'product1', quantity: 1 }]
    });
  });
  
  // Nettoyer après tous les tests
  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });
  
  describe('Collection users', () => {
    test('Un utilisateur non authentifié ne peut pas lire les utilisateurs, même avec App Check', async () => {
      const app = getTestApp(null, true);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('users').doc('normal-user').get());
    });
    
    test('Un utilisateur authentifié peut lire son propre document avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('users').doc('normal-user').get());
    });
    
    test('Un utilisateur authentifié ne peut pas lire son propre document sans App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('users').doc('normal-user').get());
    });
    
    test('Un utilisateur authentifié ne peut pas lire le document d\'un autre utilisateur, même avec App Check', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('users').doc('admin-user').get());
    });
    
    test('Un admin peut supprimer un utilisateur avec App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('users').doc('normal-user').delete());
    });
    
    test('Un admin ne peut pas supprimer un utilisateur sans App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('users').doc('normal-user').delete());
    });
  });
  
  describe('Collection products', () => {
    test('N\'importe qui peut lire les produits avec App Check valide', async () => {
      const app = getTestApp(null, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('products').doc('product1').get());
    });
    
    test('Personne ne peut lire les produits sans App Check valide', async () => {
      const app = getTestApp(null, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('products').doc('product1').get());
    });
    
    test('Un admin peut créer un produit avec App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('products').doc('new-product').set({
        name: 'New Product',
        price: 49.99,
        description: 'A new product'
      }));
    });
    
    test('Un admin ne peut pas créer un produit sans App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('products').doc('new-product').set({
        name: 'New Product',
        price: 49.99,
        description: 'A new product'
      }));
    });
    
    test('Un utilisateur normal ne peut pas créer un produit, même avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('products').doc('new-product').set({
        name: 'New Product',
        price: 49.99,
        description: 'A new product'
      }));
    });
  });
  
  describe('Collection orders', () => {
    test('Un utilisateur peut lire sa propre commande avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('orders').doc('order1').get());
    });
    
    test('Un utilisateur ne peut pas lire sa propre commande sans App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('orders').doc('order1').get());
    });
    
    test('Un utilisateur peut créer une commande pour lui-même avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('orders').doc('new-order').set({
        userId: 'normal-user',
        total: 49.99,
        items: [{ productId: 'product1', quantity: 1 }]
      }));
    });
    
    test('Un utilisateur ne peut pas créer une commande pour un autre utilisateur, même avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('orders').doc('new-order').set({
        userId: 'admin-user',
        total: 49.99,
        items: [{ productId: 'product1', quantity: 1 }]
      }));
    });
    
    test('Un admin peut mettre à jour n\'importe quelle commande avec App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('orders').doc('order1').update({
        status: 'shipped'
      }));
    });
    
    test('Un admin ne peut pas mettre à jour une commande sans App Check valide', async () => {
      const app = getTestApp({ uid: 'admin-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('orders').doc('order1').update({
        status: 'shipped'
      }));
    });
  });
  
  describe('Collection access_logs', () => {
    test('Un utilisateur authentifié peut créer un log avec App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertSucceeds(db.collection('access_logs').add({
        userId: 'normal-user',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        action: 'login'
      }));
    });
    
    test('Un utilisateur authentifié ne peut pas créer un log sans App Check valide', async () => {
      const app = getTestApp({ uid: 'normal-user' }, false);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('access_logs').add({
        userId: 'normal-user',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        action: 'login'
      }));
    });
    
    test('Un utilisateur authentifié ne peut pas modifier un log existant, même avec App Check valide', async () => {
      // Créer d'abord un log
      const admin = getAdminApp();
      const adminDb = admin.firestore();
      const logRef = await adminDb.collection('access_logs').add({
        userId: 'normal-user',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        action: 'login'
      });
      
      // Essayer de le modifier
      const app = getTestApp({ uid: 'normal-user' }, true);
      const db = app.firestore();
      
      await firebase.assertFails(db.collection('access_logs').doc(logRef.id).update({
        action: 'modified'
      }));
    });
  });
});
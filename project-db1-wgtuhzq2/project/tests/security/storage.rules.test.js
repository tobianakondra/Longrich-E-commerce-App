/**
 * Tests pour les règles de sécurité Storage avec App Check
 * 
 * Ces tests vérifient que les règles de sécurité Storage fonctionnent correctement
 * avec l'intégration d'App Check.
 */

const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Chemin vers les règles Storage
const RULES_PATH = path.join(__dirname, '../../storage.rules');

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
 * Charge les règles Storage depuis le fichier
 * @returns {Promise<void>}
 */
async function loadRules() {
  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  await firebase.loadStorageRules({
    projectId: 'test-project',
    rules
  });
}

describe('Règles de sécurité Storage avec App Check', () => {
  // Nettoyer avant chaque test
  beforeEach(async () => {
    await loadRules();
  });
  
  // Nettoyer après tous les tests
  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()));
  });
  
  describe('Accès en lecture', () => {
    test('N\'importe qui peut lire un fichier avec App Check valide', async () => {
      const app = getTestApp(null, true);
      const storage = app.storage();
      
      await firebase.assertSucceeds(storage.ref('images/public.jpg').getDownloadURL());
    });
    
    test('Personne ne peut lire un fichier sans App Check valide', async () => {
      const app = getTestApp(null, false);
      const storage = app.storage();
      
      await firebase.assertFails(storage.ref('images/public.jpg').getDownloadURL());
    });
    
    test('Un utilisateur authentifié peut lire un fichier avec App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, true);
      const storage = app.storage();
      
      await firebase.assertSucceeds(storage.ref('images/public.jpg').getDownloadURL());
    });
    
    test('Un utilisateur authentifié ne peut pas lire un fichier sans App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, false);
      const storage = app.storage();
      
      await firebase.assertFails(storage.ref('images/public.jpg').getDownloadURL());
    });
  });
  
  describe('Accès en écriture', () => {
    test('Un utilisateur non authentifié ne peut pas écrire un fichier, même avec App Check valide', async () => {
      const app = getTestApp(null, true);
      const storage = app.storage();
      
      await firebase.assertFails(storage.ref('images/new-file.jpg').putString('test data'));
    });
    
    test('Un utilisateur authentifié peut écrire un fichier avec App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, true);
      const storage = app.storage();
      
      await firebase.assertSucceeds(storage.ref('images/new-file.jpg').putString('test data'));
    });
    
    test('Un utilisateur authentifié ne peut pas écrire un fichier sans App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, false);
      const storage = app.storage();
      
      await firebase.assertFails(storage.ref('images/new-file.jpg').putString('test data'));
    });
    
    test('Un utilisateur authentifié peut écrire dans son dossier personnel avec App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, true);
      const storage = app.storage();
      
      await firebase.assertSucceeds(storage.ref('users/user123/profile.jpg').putString('test data'));
    });
  });
  
  describe('Scénarios spécifiques', () => {
    test('Un utilisateur authentifié peut supprimer son propre fichier avec App Check valide', async () => {
      const app = getTestApp({ uid: 'user123' }, true);
      const storage = app.storage();
      
      // D'abord, créer le fichier
      await firebase.assertSucceeds(storage.ref('users/user123/profile.jpg').putString('test data'));
      
      // Ensuite, le supprimer
      await firebase.assertSucceeds(storage.ref('users/user123/profile.jpg').delete());
    });
    
    test('Un utilisateur authentifié ne peut pas supprimer le fichier d\'un autre utilisateur, même avec App Check valide', async () => {
      // Créer un fichier pour user123
      const app1 = getTestApp({ uid: 'user123' }, true);
      const storage1 = app1.storage();
      await firebase.assertSucceeds(storage1.ref('users/user123/profile.jpg').putString('test data'));
      
      // Essayer de le supprimer avec user456
      const app2 = getTestApp({ uid: 'user456' }, true);
      const storage2 = app2.storage();
      await firebase.assertFails(storage2.ref('users/user123/profile.jpg').delete());
    });
  });
});
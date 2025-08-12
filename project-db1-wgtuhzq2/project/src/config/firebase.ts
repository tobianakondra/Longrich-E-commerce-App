import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheckService, AppCheckConfig } from './appCheck';
import { isAppCheckDebugEnabled, checkAppCheckDebugConfiguration } from '../utils/appCheckDebug';

// Configuration Firebase utilisant les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configuration et initialisation d'App Check
const appCheckConfig: AppCheckConfig = {
  isDebug: isAppCheckDebugEnabled(),
  recaptchaSiteKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY || '',
  recaptchaEnterpriseKey: import.meta.env.VITE_FIREBASE_RECAPTCHA_ENTERPRISE_KEY,
  autoRefresh: true
};

// Vérifier la configuration du mode debug
checkAppCheckDebugConfiguration();

// Initialiser App Check
const appCheckResult = initializeAppCheckService(app, appCheckConfig);

// Exporter le résultat de l'initialisation d'App Check
export const appCheck = appCheckResult.appCheck;

// Afficher un message d'erreur si l'initialisation a échoué
if (!appCheckResult.success) {
  console.error('Erreur lors de l\'initialisation d\'App Check:', appCheckResult.error);
  
  // En développement, afficher un message plus détaillé
  if (import.meta.env.MODE !== 'production') {
    console.warn(`
      ⚠️ App Check n'a pas pu être initialisé. Cela peut être dû à:
      - Des clés reCAPTCHA manquantes ou invalides
      - Un problème réseau
      - Un problème avec le service reCAPTCHA
      
      Vérifiez vos variables d'environnement et votre connexion internet.
      L'application continuera à fonctionner, mais les requêtes Firebase pourraient être rejetées.
    `);
  }
}

export default app;
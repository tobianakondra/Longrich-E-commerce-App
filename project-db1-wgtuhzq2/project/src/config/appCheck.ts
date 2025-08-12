import { FirebaseApp } from 'firebase/app';
import {
  AppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
  getToken,
  onTokenChanged,
  setTokenAutoRefreshEnabled
} from '@firebase/app-check';

/**
 * Types d'erreurs App Check
 */
export enum AppCheckErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  RECAPTCHA_ERROR = 'RECAPTCHA_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface pour les erreurs App Check
 */
export interface AppCheckError {
  type: AppCheckErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
}

/**
 * Statuts possibles d'App Check
 */
export enum AppCheckStatus {
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  DISABLED = 'DISABLED'
}

/**
 * Interface pour les informations de statut d'App Check
 */
export interface AppCheckStatusInfo {
  status: AppCheckStatus;
  lastTokenRefresh?: Date;
  error?: AppCheckError;
}

/**
 * Interface pour la configuration App Check
 */
export interface AppCheckConfig {
  isDebug: boolean;
  recaptchaSiteKey: string;
  recaptchaEnterpriseKey?: string;
  autoRefresh: boolean;
}

/**
 * Interface pour le résultat de l'initialisation
 */
export interface AppCheckInitResult {
  success: boolean;
  appCheck?: AppCheck;
  error?: AppCheckError;
}

// Variables globales pour le statut et l'instance d'App Check
let appCheckInstance: AppCheck | null = null;
let appCheckStatus: AppCheckStatusInfo = {
  status: AppCheckStatus.NOT_INITIALIZED
};

/**
 * Initialise App Check avec le fournisseur approprié selon la configuration
 * @param app Instance FirebaseApp
 * @param config Configuration App Check
 * @returns Résultat de l'initialisation
 */
export function initializeAppCheckService(app: FirebaseApp, config: AppCheckConfig): AppCheckInitResult {
  try {
    // Mettre à jour le statut
    appCheckStatus = {
      status: AppCheckStatus.INITIALIZING
    };

    // Déterminer le fournisseur à utiliser
    let provider;
    
    // Utiliser reCAPTCHA v3 dans tous les environnements
    provider = new ReCaptchaV3Provider(config.recaptchaSiteKey);
    console.log('App Check: Utilisation du fournisseur reCAPTCHA v3');

    // Initialiser App Check
    const appCheck = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: config.autoRefresh,
      // Activer le mode debug en développement si un token de debug est fourni
      ...(config.isDebug && import.meta.env.MODE !== 'production' && {
        debug: {
          apiKey: import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN,
          siteKey: config.recaptchaSiteKey,
        }
      })
    });

    // Configurer l'écouteur de changement de token
    onTokenChanged(appCheck, (token) => {
      appCheckStatus = {
        status: AppCheckStatus.ACTIVE,
        lastTokenRefresh: new Date()
      };
      console.log('App Check: Token rafraîchi avec succès');
    }, (error) => {
      const appCheckError: AppCheckError = {
        type: mapErrorType(error),
        message: error.message,
        originalError: error,
        timestamp: new Date()
      };
      
      appCheckStatus = {
        status: AppCheckStatus.ERROR,
        error: appCheckError
      };
      
      console.error('App Check: Erreur lors du rafraîchissement du token', appCheckError);
    });

    // Configurer le rafraîchissement automatique des tokens
    setTokenAutoRefreshEnabled(appCheck, config.autoRefresh);

    // Stocker l'instance
    appCheckInstance = appCheck;
    
    // Mettre à jour le statut
    appCheckStatus = {
      status: AppCheckStatus.ACTIVE
    };

    return {
      success: true,
      appCheck
    };
  } catch (error) {
    const appCheckError: AppCheckError = {
      type: mapErrorType(error as Error),
      message: (error as Error).message,
      originalError: error as Error,
      timestamp: new Date()
    };
    
    appCheckStatus = {
      status: AppCheckStatus.ERROR,
      error: appCheckError
    };
    
    console.error('App Check: Erreur lors de l\'initialisation', appCheckError);
    
    return {
      success: false,
      error: appCheckError
    };
  }
}

/**
 * Vérifie si App Check est disponible
 * @returns true si App Check est initialisé et actif
 */
export function isAppCheckAvailable(): boolean {
  return appCheckInstance !== null && appCheckStatus.status === AppCheckStatus.ACTIVE;
}

/**
 * Obtient le statut actuel d'App Check
 * @returns Informations sur le statut d'App Check
 */
export function getAppCheckStatus(): AppCheckStatusInfo {
  return { ...appCheckStatus };
}

/**
 * Force le rafraîchissement du token App Check
 * @returns Promise avec le token ou une erreur
 */
export async function forceTokenRefresh(): Promise<string> {
  if (!appCheckInstance) {
    throw new Error('App Check n\'est pas initialisé');
  }
  
  try {
    const tokenResult = await getToken(appCheckInstance, true);
    
    appCheckStatus = {
      status: AppCheckStatus.ACTIVE,
      lastTokenRefresh: new Date()
    };
    
    return tokenResult.token;
  } catch (error) {
    const appCheckError: AppCheckError = {
      type: mapErrorType(error as Error),
      message: (error as Error).message,
      originalError: error as Error,
      timestamp: new Date()
    };
    
    appCheckStatus = {
      status: AppCheckStatus.ERROR,
      error: appCheckError
    };
    
    throw appCheckError;
  }
}

/**
 * Mappe les erreurs Firebase en types d'erreurs App Check
 * @param error Erreur d'origine
 * @returns Type d'erreur App Check
 */
function mapErrorType(error: Error): AppCheckErrorType {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return AppCheckErrorType.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('recaptcha') || errorMessage.includes('captcha')) {
    return AppCheckErrorType.RECAPTCHA_ERROR;
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return AppCheckErrorType.QUOTA_EXCEEDED;
  }
  
  if (errorMessage.includes('initialize') || errorMessage.includes('init')) {
    return AppCheckErrorType.INITIALIZATION_FAILED;
  }
  
  if (errorMessage.includes('token') || errorMessage.includes('refresh')) {
    return AppCheckErrorType.TOKEN_REFRESH_FAILED;
  }
  
  return AppCheckErrorType.UNKNOWN;
}
/**
 * Utilitaire pour configurer le mode debug d'App Check
 * 
 * Ce fichier contient des fonctions pour aider les développeurs à configurer
 * et utiliser le mode debug d'App Check pendant le développement.
 */

/**
 * Vérifie si le mode debug d'App Check est activé
 * @returns true si le mode debug est activé
 */
export function isAppCheckDebugEnabled(): boolean {
    return import.meta.env.MODE !== 'production' &&
        !!import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;
}

/**
 * Génère un token de debug pour App Check
 * 
 * Cette fonction est utile pour générer un nouveau token de debug
 * à utiliser dans les variables d'environnement.
 * 
 * @returns Un token de debug aléatoire
 */
export function generateAppCheckDebugToken(): string {
    // Générer une chaîne aléatoire de 40 caractères
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 40; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Instructions pour configurer le mode debug d'App Check
 * 
 * Cette fonction affiche des instructions pour aider les développeurs
 * à configurer le mode debug d'App Check.
 */
export function printAppCheckDebugInstructions(): void {
    if (import.meta.env.MODE === 'production') {
        console.warn('App Check: Le mode debug ne doit pas être utilisé en production');
        return;
    }

    console.log(`
==========================================================
INSTRUCTIONS POUR CONFIGURER LE MODE DEBUG D'APP CHECK
==========================================================

1. Générez un token de debug en exécutant dans la console:
   const token = generateAppCheckDebugToken();
   console.log('Votre token de debug:', token);

2. Ajoutez ce token dans votre fichier .env.local:
   VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=votre-token-généré

3. Redémarrez votre application

4. Ouvrez la console Firebase et activez le token de debug:
   - Allez dans la console Firebase > App Check
   - Cliquez sur "Manage debug tokens"
   - Ajoutez votre token généré

Note: Le mode debug ne doit être utilisé que pendant le développement.
==========================================================
`);
}

/**
 * Vérifie la configuration du mode debug d'App Check
 * 
 * Cette fonction vérifie si le mode debug est correctement configuré
 * et affiche des avertissements ou des instructions si nécessaire.
 */
export function checkAppCheckDebugConfiguration(): void {
    if (import.meta.env.MODE === 'production' &&
        import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
        console.error('App Check: ATTENTION - Un token de debug est défini en production. Cela représente un risque de sécurité.');
    }

    if (import.meta.env.MODE !== 'production' &&
        !import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN) {
        console.warn('App Check: Aucun token de debug n\'est défini. Le développement local pourrait être difficile.');
        printAppCheckDebugInstructions();
    }
}
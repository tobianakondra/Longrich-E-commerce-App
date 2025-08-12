/**
 * Utilitaires de sécurité pour l'application
 * Ces fonctions aident à protéger le code contre l'inspection et la manipulation
 */

// Fonction pour encoder une chaîne en base64 avec une légère obfuscation
export const encode = (str: string): string => {
  const b64 = btoa(str);
  return b64.split('').reverse().join('');
};

// Fonction pour décoder une chaîne encodée
export const decode = (encoded: string): string => {
  const reversed = encoded.split('').reverse().join('');
  return atob(reversed);
};

// Fonction pour masquer une valeur sensible (comme une clé API)
export const maskValue = (value: string): string => {
  if (!value) return '';
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
};

// Fonction pour détecter les outils de développement
export const detectDevTools = (): boolean => {
  const devToolsKeys = [
    '__REACT_DEVTOOLS_GLOBAL_HOOK__',
    '__REDUX_DEVTOOLS_EXTENSION__',
    '__REACT_DEVELOPER_TOOLS__'
  ];

  return devToolsKeys.some(key => key in window);
};

// Fonction pour détecter si l'application est en cours de débogage
export const detectDebugger = (): boolean => {
  let isDebuggerAttached = false;

  try {
    // Cette fonction sera lente si un débogueur est attaché
    const start = Date.now();
    debugger; // eslint-disable-line no-debugger
    const end = Date.now();

    isDebuggerAttached = (end - start) > 100;
  } catch (e) {
    // Ignorer les erreurs
  }

  return isDebuggerAttached;
};

// Fonction pour protéger contre l'extraction du code source
export const protectSource = (): void => {
  if (import.meta.env.PROD) {
    // Désactiver le clic droit
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // La sélection de texte est maintenant autorisée
    // document.addEventListener('selectstart', (e) => {
    //   e.preventDefault();
    //   return false;
    // });

    // Désactiver le raccourci clavier pour les outils de développement
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67))
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Vérifier périodiquement les outils de développement
    setInterval(() => {
      if (detectDevTools() || detectDebugger()) {
        // Rediriger ou afficher un message d'erreur
        window.location.href = '/';
      }
    }, 1000);
  }
};

// Initialiser les protections
export const initSecurity = (): void => {
  if (import.meta.env.PROD) {
    protectSource();

    // Masquer les informations de console
    const originalConsole = { ...console };

    if (import.meta.env.VITE_DISABLE_LOGS === 'true') {
      // Remplacer les méthodes de console par des fonctions vides
      console.log = () => { };
      console.info = () => { };
      console.warn = () => { };
      console.error = () => { };
      console.debug = () => { };
    }

    // Ajouter un message trompeur pour les développeurs curieux
    setTimeout(() => {
      originalConsole.log(
        '%c⚠️ Attention!',
        'color: red; font-size: 30px; font-weight: bold;'
      );
      originalConsole.log(
        '%cCette fonctionnalité du navigateur est destinée aux développeurs. Si quelqu\'un vous a demandé de copier-coller quelque chose ici, il s\'agit probablement d\'une tentative de piratage.',
        'font-size: 18px;'
      );
    }, 2000);
  }
}; 
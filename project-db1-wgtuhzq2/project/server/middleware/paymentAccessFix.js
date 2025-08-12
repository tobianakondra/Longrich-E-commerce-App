/**
 * Middleware pour autoriser l'accès aux endpoints de paiement et ressources statiques sans vérification d'en-têtes
 * Ce fichier doit être importé et utilisé dans server.js
 */

export const paymentAccessFix = (req, res, next) => {
  // Vérifier si c'est une requête liée au paiement, aux ressources statiques, aux IPN ou SSE
  if (req.path.startsWith('/payment-proxy/') ||
    req.path.startsWith('/payment-content/') ||
    req.path.startsWith('/payment-success/') ||
    req.path.startsWith('/static/') ||
    req.path.startsWith('/api/ipn/') ||
    req.path.startsWith('/api/sse/') ||
    req.path === '/payment-error') {

    console.log(`[PAYMENT ACCESS] Autorisation automatique pour: ${req.path}`);
    console.log(`[PAYMENT ACCESS] Headers: Origin=${req.headers.origin}, Referer=${req.headers.referer}`);

    // Marquer explicitement la requête comme autorisée
    req.paymentBypass = true;

    // Passer au middleware suivant sans vérification
    return next();
  }

  // Pour les autres requêtes, continuer normalement
  next();
};

export default paymentAccessFix;
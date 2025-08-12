# Solution pour les Ressources Statiques dans le Proxy de Paiement

Ce document explique comment nous avons résolu le problème des ressources statiques dans le proxy de paiement Wave.

## Problème Initial

Les ressources statiques (images, scripts, styles) sous le chemin `/static/*` n'étaient pas correctement chargées dans l'interface de paiement Wave. Initialement, nous pensions que le problème était lié à Cloudflare qui bloquait ces requêtes, mais après analyse, nous avons découvert que le problème était plus profond.

## Analyse du Problème

Après avoir désactivé temporairement Cloudflare et constaté que le problème persistait, nous avons compris que le problème n'était pas lié à Cloudflare mais plutôt à la façon dont notre serveur gérait les requêtes vers `/static/*`.

Les principales causes du problème étaient :

1. **Vérification des en-têtes** : Notre middleware de vérification des en-têtes `Origin` et `Referer` bloquait les requêtes vers `/static/*` qui ne contenaient pas ces en-têtes.
2. **Récupération des ressources** : La façon dont nous récupérions les ressources depuis le serveur Wave n'était pas optimale, ce qui entraînait des erreurs.

## Solution Mise en Place

Nous avons mis en place plusieurs modifications pour résoudre ce problème :

### 1. Modification du Middleware d'Autorisation

Nous avons modifié le middleware `paymentAccessFix.js` pour autoriser explicitement les requêtes vers `/static/*` sans vérification d'en-têtes :

```javascript
export const paymentAccessFix = (req, res, next) => {
  // Vérifier si c'est une requête liée au paiement ou aux ressources statiques
  if (req.path.startsWith('/payment-proxy/') ||
    req.path.startsWith('/payment-content/') ||
    req.path.startsWith('/payment-success/') ||
    req.path.startsWith('/static/') ||
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
```

### 2. Amélioration de la Récupération des Ressources

Nous avons amélioré la façon dont nous récupérons les ressources depuis le serveur Wave en ajoutant des en-têtes plus robustes et des logs supplémentaires :

```javascript
// Récupérer la ressource depuis Wave avec des en-têtes améliorés
console.log(`[STATIC RESOURCE] Tentative de récupération de: ${waveResourceUrl}`);

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': `${req.protocol}://${req.get('host')}`,
  'Referer': `${req.protocol}://${req.get('host')}/payment-proxy/`,
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

console.log(`[STATIC RESOURCE] En-têtes de requête:`, headers);

const response = await fetch(waveResourceUrl, { headers });
```

### 3. Optimisation du Cache

Nous avons optimisé les en-têtes de cache pour améliorer les performances :

```javascript
// Ajouter des headers de cache pour améliorer les performances
res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache pendant 24 heures
res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString()); // Expire dans 24 heures
```

### 4. Ressources Personnalisées

Nous avons également défini des ressources SVG personnalisées pour les ressources les plus couramment utilisées, ce qui nous permet d'éviter de les récupérer depuis le serveur Wave :

```javascript
// Ressources spécifiques à remplacer par des versions personnalisées
const specificResources = {
  '/static/payez-avec-wave-stacked.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
    <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
      Payez avec Wave
    </text>
  </svg>`,
  '/static/camera-icon.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path fill="white" d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
    <path fill="white" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>`,
  '/static/wave-logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
    <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
      WAVE
    </text>
  </svg>`
};
```

## Résultats

Ces modifications ont permis de résoudre le problème des ressources statiques dans le proxy de paiement Wave. Les ressources sont maintenant correctement chargées et affichées dans l'interface de paiement.

## Recommandations pour l'Avenir

Pour éviter des problèmes similaires à l'avenir, nous recommandons :

1. **Surveillance des Logs** : Surveiller régulièrement les logs du serveur pour détecter les erreurs liées aux ressources statiques.
2. **Tests Réguliers** : Tester régulièrement l'interface de paiement pour s'assurer que toutes les ressources sont correctement chargées.
3. **Mise à Jour des Ressources Personnalisées** : Mettre à jour régulièrement les ressources personnalisées pour refléter les changements dans l'interface Wave.
4. **Optimisation Continue** : Continuer à optimiser la récupération et le cache des ressources pour améliorer les performances.

## Conclusion

Le problème des ressources statiques dans le proxy de paiement Wave a été résolu en modifiant la façon dont notre serveur gère les requêtes vers `/static/*`. Cette solution est robuste et devrait continuer à fonctionner même si Cloudflare est activé ou désactivé.
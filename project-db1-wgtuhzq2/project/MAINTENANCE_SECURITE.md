# Guide de Maintenance : Sécurité et Infrastructure Firebase (Longrich)

Ce document explique le fonctionnement de la sécurité App Check, de la gestion des clés API Google Cloud et des bonnes pratiques pour les futurs développeurs.

## 1. Firebase App Check & reCAPTCHA v3

Pour protéger la base de données Firestore contre les bots et les accès non autorisés, le projet utilise **App Check** avec **reCAPTCHA v3**.

### Fonctionnement
Chaque requête envoyée à Firebase doit être accompagnée d'un jeton (token) prouvant que la requête provient bien de l'application Longrich officielle.

### Configuration requise
Si vous changez de domaine ou de projet Firebase, vous devez :
1.  Générer des clés reCAPTCHA v3 sur la [Console reCAPTCHA](https://www.google.com/recaptcha/admin).
2.  **Domaines autorisés :** Enregistrez les domaines (ex: `longrich.online`) **SANS** le protocole `https://`.
3.  **Console Firebase :** Allez dans "App Check" et liez votre clé secrète reCAPTCHA.

---

## 2. Gestion des Clés API (Google Cloud Console)

Les clés API Firebase (commençant par `AIza...`) sont publiques par nature. Leur sécurité repose sur les **restrictions côté serveur**.

### Restrictions d'API (Obligatoire)
Pour éviter qu'une clé ne soit utilisée pour d'autres services coûteux, elle doit être restreinte aux API suivantes :
*   **Identity Toolkit API** (Authentification)
*   **Cloud Firestore API** (Base de données)
*   **Firebase App Check API** (Vérification de l'application)
*   **Token Service API** (Rafraîchissement des sessions)

### Restrictions d'application (HTTP Referrers)
La clé ne doit fonctionner que sur vos domaines officiels :
*   `https://longrich.online/*`
*   `https://longrich-3212d.firebaseapp.com/*`
*   `https://longrich-3212d.web.app/*`

---

## 3. Mode Debug (Maintenance et Développement)

Le mode Debug permet de contourner reCAPTCHA pour les tests ou en cas de blocage ("Throttling") par Google.

### Comment utiliser un Debug Token
1.  Générez un jeton dans **Console Firebase > App Check > Gérer les jetons de débogage**.
2.  Ajoutez-le dans le fichier `.env` : `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=votre_jeton`.
3.  Le SDK Firebase détectera automatiquement ce jeton et autorisera l'accès.

**⚠️ IMPORTANT :** En production, une fois que reCAPTCHA fonctionne normalement, **videz** la valeur de `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN` pour ne pas exposer ce jeton en console et pour réactiver la vraie sécurité.

---

## 4. Bonnes Pratiques de Maintenance

1.  **Build & Déploiement :** Toute modification des variables d'environnement (`.env`) nécessite un nouveau build (`npm run build`) suivi d'un déploiement (`firebase deploy`).
2.  **Logs Console :** Si vous voyez des erreurs 403 sur `exchangeDebugToken`, vérifiez que l'API "Firebase App Check" est bien autorisée dans la Google Cloud Console.
3.  **Rotation des clés :** En cas de suspicion de faille, générez une nouvelle clé API dans Google Cloud et mettez à jour le `.env` immédiatement.
4.  **Idempotence :** Pour les services de paiement (SenePay/Wave), assurez-vous que les Webhooks vérifient toujours si une commande est déjà marquée comme `paid` avant d'agir (déjà implémenté dans `routes/ipn.js`).

---

*Document généré le 6 Juin 2026 pour l'équipe technique Longrich.*

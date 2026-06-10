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

Les clés API Firebase (commençant par `AIza...`) sont publiques. Pour éviter qu'un tiers ne les utilise à vos frais ou pour accéder à vos données, nous avons mis en place un **"Bouclier de Restrictions"**.

### Pourquoi ces restrictions ?
Sans ces réglages, n'importe qui possédant votre clé pourrait appeler d'autres services Google payants (Google Maps, Traduction, etc.) en utilisant votre compte. Le bouclier limite la clé à **votre site uniquement** et aux **services Firebase uniquement**.

### Configuration du Bouclier (Application)
La clé est restreinte par **"HTTP Referrers"** (Sites Web). Elle rejette toute requête ne provenant pas de :
*   `https://longrich.online/*` (Votre domaine principal)
*   `https://longrich-3212d.firebaseapp.com/*` (Domaine technique Firebase)
*   `https://longrich-3212d.web.app/*` (Domaine secondaire Firebase)
*   `http://localhost:*` (Uniquement pour vos tests locaux)

### Configuration du Bouclier (API)
La clé est limitée aux services strictement nécessaires au projet. Toute tentative d'utiliser cette clé pour un autre service Google échouera. Les API autorisées sont :
1.  **Identity Toolkit API :** Pour la connexion des clients (Auth).
2.  **Cloud Firestore API :** Pour l'accès à la base de données des produits et commandes.
3.  **Firebase App Check API :** Pour la protection contre les bots.
4.  **Token Service API :** Pour la gestion sécurisée des sessions et jetons.

**⚠️ Note :** Si vous ajoutez un nouveau service Google (ex: Google Maps pour la livraison), vous **devez** retourner dans la console Google Cloud pour l'ajouter à cette liste, sinon le service renverra une erreur 403.

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

## 5. Intégrité des Données et Performance

### Stratégie "Auto-Healing" du Panier
Le projet a migré du stockage d'images en **Base64** (lourd et lent) vers des **URLs CDN Uploadcare**. 

Pour garantir une transition invisible pour les anciens utilisateurs :
*   **Nettoyage Dynamique :** Le `CartContext.tsx` contient une logique qui détecte les chaînes `data:image/...` dans le panier de l'utilisateur lors de sa connexion.
*   **Synchronisation :** Ces données obsolètes sont immédiatement remplacées par les URLs du catalogue officiel et sauvegardées dans Firestore.
*   **Bénéfice :** Cette approche évite de charger des documents Firestore de plusieurs mégaoctets et garantit que les images s'affichent toujours, même si le format de stockage change.

---

*Document généré le 9 Juin 2026 pour l'équipe technique Longrich.*

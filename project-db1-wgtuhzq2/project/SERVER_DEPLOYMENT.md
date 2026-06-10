# 🛠️ Guide d'Infrastructure et Déploiement Backend - Longrich

Ce document détaille la configuration du serveur de paiement sécurisé (Proxy API) pour la plateforme Longrich.

## 1. Architecture Globale
Le projet est séparé en deux entités :
*   **Frontend :** React (Vite) hébergé sur Firebase Hosting.
*   **Backend :** Node.js/Express hébergé sur un VPS LWS, servant d'API sécurisée pour SenePay et Twilio.

---

## 2. Configuration du VPS (LWS)

### Pré-requis
*   Système : Ubuntu 22.04+ / Debian 11+
*   Node.js : v18+
*   Nginx : Installé et actif

### Installation des outils
```bash
sudo apt update
sudo apt install nodejs npm nginx certbot python3-certbot-nginx -y
sudo npm install -g pm2
```

---

## 3. Le Bouclier Nginx (Sécurité Niveau 1)

Le fichier `/etc/nginx/sites-available/longrich` agit comme un pare-feu applicatif. Il est configuré en mode **Hybride**.

### 🛠️ Gestion du Mode Développement (Localhost)

#### 1. Comment ACTIVER le mode Dev
Pour permettre à votre ordinateur local de communiquer avec l'API en ligne :
*   **Dans Nginx :** Vérifiez que la regex inclut `localhost|127\.0\.0\.1`.
```nginx
if ($http_origin ~* "^https?://(longrich\.online|www\.longrich\.online|longrich-3212d\.web\.app|longrich-3212d\.firebaseapp\.com|localhost|127\.0\.0\.1)(:[0-9]+)?$") {
    set $allowed_origin 1;
}
```
*   **Dans Cloudflare :** Passez impérativement le sous-domaine `api` en **Nuage Gris** (DNS Only).
*   **Note technique :** Nginx ne doit **pas** ajouter de headers `Access-Control-Allow-Origin`, car Node.js s'en occupe déjà via le middleware CORS. Nginx sert uniquement à rejeter (403) les domaines non listés.

#### 2. Comment DÉSACTIVER le mode Dev (Passage en PROD totale)
Pour verrouiller le serveur avant le lancement officiel :
1.  Éditez `/etc/nginx/sites-available/longrich`.
2.  Supprimez `|localhost|127\.0\.0\.1` de la regex ci-dessus.
3.  Réactivez le **Nuage Orange** sur Cloudflare.
4.  Relancez Nginx : `sudo systemctl restart nginx`.
5.  (Optionnel) Retirez aussi `localhost` des listes dans `server.js` pour un double verrouillage.

### Commandes utiles (Rafraîchir Nginx)
*   **Vérifier la syntaxe :** `sudo nginx -t`
*   **Appliquer les changements :** `sudo systemctl restart nginx`
*   **Renouveler SSL :** `sudo certbot --nginx -d api.longrich.online`

---

## 4. Le Double Verrouillage (Nginx + Node.js)

**Attention :** Ajouter `localhost` dans Nginx ne suffit pas. Votre serveur Node.js possède sa propre couche de sécurité logicielle intégrée. Si la requête passe le bouclier Nginx mais n'est pas autorisée dans le code source `server.js`, elle sera quand même rejetée avec une erreur 403.

### La Solution : Mise à jour de la Whitelist Applicative
Dans `server/server.js`, assurez-vous que les domaines de développement sont présents dans les listes `allowedDomains` et `allowedOrigins`, même en mode production :

```javascript
// Dans server.js (Whitelist applicative)
const allowedDomains = [
  'longrich.online',
  // ... autres domaines ...
  'localhost',  // <--- INDISPENSABLE pour le dev local
  '127.0.0.1'   // <--- INDISPENSABLE pour le dev local
];
```

**⚠️ AVERTISSEMENT DE SÉCURITÉ :** N'oubliez jamais de retirer `localhost` et `127.0.0.1` de vos whitelists (Nginx et Node.js) avant le lancement officiel. Garder ces adresses autorisées constitue un risque si un attaquant parvient à exécuter des scripts sur votre machine locale.

---

## 5. Gestion du Processus (PM2)

Le serveur tourne en continu grâce à PM2.
*   **Nom du processus :** `longrich-api`
*   **Démarrage :** `pm2 start start-server.js --name "longrich-api"`
*   **Persistance :** `pm2 startup` puis `pm2 save` (pour redémarrer après un reboot du VPS).

---

## 6. Intégration Firebase Admin

Le serveur utilise le SDK Admin pour mettre à jour les commandes dans Firestore.
*   **Fichier critique :** `longrich-3212d-7b2897d075b7.json`.
*   **Emplacement :** Doit se trouver à la racine du dossier `/server/` sur le VPS.
*   **Sécurité :** Ce fichier est exclu de Git via `.gitignore`. Il doit être transféré manuellement via SCP.

---

## 7. Flux de Paiement SenePay (API Direct)

Nous avons migré de PayDunya vers SenePay en utilisant le flux **API Direct**.
1.  **Initiation :** L'API renvoie une `redirectUrl` Wave officielle.
2.  **Validation :** Gérée par Webhook (IPN) sur `/api/ipn/senepay-ipn`.
3.  **Sécurité IPN :** Vérification de signature **HMAC-SHA256** obligatoire pour chaque notification.
4.  **Idempotence :** Le serveur vérifie le statut `paid` dans Firestore avant tout traitement pour éviter les doublons.

---

## 8. Maintenance et Logs

*   **Logs en temps réel :** `pm2 logs longrich-api`
*   **Variables d'env :** Gérées via un fichier `.env` local au VPS (jamais sur Git).
*   **Mise à jour :**
    ```bash
    git pull
    npm install --production
    pm2 restart longrich-api
    ```

---

## 9. Prochaines Étapes de Sécurisation (Backlog)

Pour atteindre un niveau de sécurité "Forteresse", les évolutions suivantes sont prévues :

### A. Verrouillage IP du Pare-feu (UFW)
Actuellement, le serveur accepte les connexions sur le port 443 de n'importe quelle adresse IP. La prochaine étape consiste à configurer le pare-feu du VPS pour qu'il rejette tout trafic web ne provenant pas des **IP officielles de Cloudflare**.
*   **Objectif :** Rendre le serveur invisible aux scans (Nmap) et empêcher le contournement des règles de sécurité de Cloudflare.
*   **Précautions :** Garder le port 22 (SSH) ouvert avec authentification par clé uniquement pour éviter le verrouillage accidentel (Lockout).

### B. Automatisation des mises à jour d'IP
Mettre en place un script cron qui récupère périodiquement la liste à jour des IPs Cloudflare (https://www.cloudflare.com/ips-v4) et met à jour les règles UFW automatiquement.

### C. Monitoring et Alertes
Installer un outil comme **Fail2Ban** pour bannir automatiquement les IPs qui tentent de forcer l'accès SSH ou qui scannent des répertoires interdits.

---

*Document généré le 7 Juin 2026. Priorité : Sécurité et Stabilité.*

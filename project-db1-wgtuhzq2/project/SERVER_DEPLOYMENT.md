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

Le fichier `/etc/nginx/sites-available/longrich` agit comme un pare-feu applicatif. Il est configuré pour :
1.  **Forcer le HTTPS** via Let's Encrypt.
2.  **Restreindre l'Origin :** Seul le site `longrich.online` et les domaines Firebase associés sont autorisés à appeler l'API.
3.  **Autoriser les outils de dev :** Les adresses `localhost` et `127.0.0.1` (avec tous les ports) sont incluses dans la whitelist pour permettre le développement local sans blocage.
4.  **Protection CORS :** Toute requête provenant d'un domaine tiers (hacker) est rejetée avec une erreur 403 avant même d'atteindre Node.js.

### Configuration de la Whitelist (Regex Nginx)
```nginx
if ($http_origin ~* "^https?://(longrich\.online|www\.longrich\.online|longrich-3212d\.web\.app|longrich-3212d\.firebaseapp\.com|localhost|127\.0\.0\.1)(:[0-9]+)?$") {
    set $allowed_origin 1;
}
```

### Commandes utiles (Rafraîchir Nginx)
*   **Vérifier la syntaxe :** `sudo nginx -t`
*   **Appliquer les changements :** `sudo systemctl restart nginx`
*   **Recharger sans couper :** `sudo systemctl reload nginx`
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

const allowedOrigins = [
  'https://longrich.online',
  // ... autres origins ...
  'http://localhost:5173', // <--- Pour le dev (Vite)
  'http://localhost:3000'  // <--- Pour le dev (React)
];
```

**⚠️ AVERTISSEMENT DE SÉCURITÉ :** N'oubliez jamais de retirer `localhost` et `127.0.0.1` de vos whitelists (Nginx et Node.js) une fois vos tests terminés. Garder ces adresses autorisées en production finale constitue un risque de sécurité, car cela pourrait permettre à des scripts malveillants exécutés localement par un attaquant d'interagir avec votre API.

---

## 5. Gestion du Processus (PM2)

Le serveur tourne en continu grâce à PM2.
*   **Nom du processus :** `longrich-api`
*   **Démarrage :** `pm2 start start-server.js --name "longrich-api"`
*   **Persistance :** `pm2 startup` puis `pm2 save` (pour redémarrer après un reboot du VPS).

---

## 5. Intégration Firebase Admin

Le serveur utilise le SDK Admin pour mettre à jour les commandes dans Firestore.
*   **Fichier critique :** `longrich-3212d-7b2897d075b7.json`.
*   **Emplacement :** Doit se trouver à la racine du dossier `/server/` sur le VPS.
*   **Sécurité :** Ce fichier est exclu de Git via `.gitignore`. Il doit être transféré manuellement via SCP.

---

## 6. Flux de Paiement SenePay (API Direct)

Nous avons migré de PayDunya vers SenePay en utilisant le flux **API Direct**.
1.  **Initiation :** L'API renvoie une `redirectUrl` Wave officielle.
2.  **Validation :** Gérée par Webhook (IPN) sur `/api/ipn/senepay-ipn`.
3.  **Sécurité IPN :** Vérification de signature **HMAC-SHA256** obligatoire pour chaque notification.
4.  **Idempotence :** Le serveur vérifie le statut `paid` dans Firestore avant tout traitement pour éviter les doublons.

---

## 7. Maintenance et Logs

*   **Logs en temps réel :** `pm2 logs longrich-api`
*   **Variables d'env :** Gérées via un fichier `.env` local au VPS (jamais sur Git).
*   **Mise à jour :**
    ```bash
    git pull
    npm install --production
    pm2 restart longrich-api
    ```

---

*Document généré le 7 Juin 2026. Priorité : Sécurité et Stabilité.*

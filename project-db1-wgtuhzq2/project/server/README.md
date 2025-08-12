# Serveur de Paiement Longrich

Ce serveur gère les paiements Wave pour l'application Longrich. Il implémente une protection CSRF robuste et communique directement avec l'API Paydunya pour générer des liens de paiement.

## Structure des fichiers

```
server/
├── services/
│   └── paymentService.js    # Service d'intégration avec l'API Paydunya
├── server.js               # Serveur Express principal
├── start-server.js         # Script de démarrage unifié
├── .env                    # Variables d'environnement (à créer)
├── .env.example            # Exemple de variables d'environnement
├── package.json            # Dépendances du serveur
└── README.md               # Ce fichier
```

## Installation

1. Installez les dépendances :

```bash
cd server
npm install
```

2. Créez un fichier `.env` basé sur `.env.example` et ajoutez vos clés API Paydunya :

```bash
cp .env.example .env
# Éditez le fichier .env pour ajouter vos clés API
```

## Démarrage du serveur

```bash
# Démarrage standard (production)
npm start

# Démarrage en mode développement
npm run dev

# Démarrage explicite en mode production
npm run prod
```

Le serveur démarrera sur le port 4000 par défaut. Vous pouvez modifier le port en définissant la variable d'environnement `PORT`.

## Configuration des clés API

Pour que le serveur fonctionne correctement, vous devez configurer les variables d'environnement suivantes dans le fichier `.env` :

```
PAYDUNYA_MASTER_KEY=votre_master_key
PAYDUNYA_PRIVATE_KEY=votre_private_key
PAYDUNYA_TOKEN=votre_token
```

Ces clés sont disponibles dans votre tableau de bord Paydunya.

## Endpoints API

### 1. Obtenir un token CSRF

```
GET /api/csrf-token
```

Retourne un token CSRF à inclure dans les requêtes ultérieures.

**Réponse** :
```json
{
  "csrfToken": "token-value"
}
```

### 2. Obtenir la liste des régions

```
GET /api/regions
```

Retourne la liste des régions du Sénégal.

**Réponse** :
```json
{
  "regions": ["Dakar", "Diourbel", "Fatick", ...]
}
```

### 3. Traiter un paiement

```
POST /api/checkout
```

**En-têtes requis** :
- `Content-Type: application/json`
- `x-csrf-token: token-value` (obtenu via l'endpoint `/api/csrf-token`)

**Corps de la requête** :
```json
{
  "phoneNumber": "771234567",
  "region": "Dakar",
  "quartier": "Plateau",
  "amount": 5000,
  "description": "Commande Longrich - 2 produit(s)"
}
```

**Réponse en cas de succès** :
```json
{
  "paymentUrl": "https://app.paydunya.com/..."
}
```

### 4. Vérifier le statut d'un paiement (optionnel)

```
GET /api/payment-status/:token
```

Retourne le statut actuel d'un paiement.

## Déploiement

Pour déployer ce serveur sur un environnement de production :

1. Transférez l'ensemble du dossier `server/` sur votre serveur
2. Installez les dépendances avec `npm install`
3. Configurez les variables d'environnement dans le fichier `.env`
4. Démarrez le serveur avec `npm start`

Pour une disponibilité continue, utilisez un gestionnaire de processus comme PM2 :

```bash
npm install -g pm2
pm2 start start-server.js --name "longrich-payment"
pm2 save
```

## Sécurité

Le serveur implémente plusieurs mesures de sécurité :

1. **Protection CSRF** : Utilisation de tokens CSRF avec expiration
2. **Cookies sécurisés** : Cookies HttpOnly et SameSite
3. **Validation des entrées** : Validation du numéro de téléphone, de la région, etc.
4. **Variables d'environnement** : Clés API stockées dans des variables d'environnement
5. **Journalisation** : Logs des événements sans données sensibles
6. **Headers de sécurité** : Via Helmet.js

## Dépannage

### Le serveur ne démarre pas

1. Vérifiez que le fichier `.env` existe et contient les clés API Paydunya
2. Vérifiez que vous avez installé toutes les dépendances avec `npm install`
3. Vérifiez que vous pouvez vous connecter à `app.paydunya.com`

### Erreur CSRF

Si vous recevez une erreur 403 avec le message "Formulaire expiré ou non valide", c'est que le token CSRF est invalide ou expiré. Obtenez un nouveau token via l'endpoint `/api/csrf-token`.

### Problèmes de paiement

Si le service de paiement échoue, vérifiez les logs du serveur pour plus de détails. Assurez-vous que les clés API Paydunya dans le fichier `.env` sont correctes. 
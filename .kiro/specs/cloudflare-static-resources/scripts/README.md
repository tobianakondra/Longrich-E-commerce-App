# Scripts de Configuration Cloudflare

Ce répertoire contient des scripts pour automatiser la configuration de Cloudflare afin d'autoriser les requêtes vers les ressources statiques sous le chemin `/static/*`.

## Prérequis

- Node.js 14+ installé
- Accès à l'API Cloudflare (clé API ou token API)
- ID de zone Cloudflare pour votre domaine

## Installation

1. Installez les dépendances nécessaires :

```bash
npm install node-fetch dotenv
```

2. Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

3. Modifiez le fichier `.env` avec vos informations d'authentification Cloudflare et l'ID de zone.

## Scripts Disponibles

### 1. Création d'une Règle de Page

Le script `create-page-rule.js` crée une règle de page Cloudflare pour autoriser les requêtes vers `/static/*` et configurer le cache approprié.

**Usage :**

```bash
node create-page-rule.js
```

### 2. Création d'une Règle de Pare-feu

Le script `create-firewall-rule.js` crée une règle de pare-feu Cloudflare pour autoriser explicitement les requêtes vers `/static/*`.

**Usage :**

```bash
node create-firewall-rule.js
```

### 3. Configuration du Cache

Le script `configure-cache.js` configure les paramètres de cache pour les ressources statiques.

**Usage :**

```bash
node configure-cache.js
```

### 4. Vérification de la Configuration

Le script `verify-config.js` vérifie que la configuration a été correctement appliquée.

**Usage :**

```bash
node verify-config.js
```

## Utilisation Combinée

Pour appliquer toute la configuration en une seule fois, utilisez le script `configure-all.js` :

```bash
node configure-all.js
```

## Résolution des Problèmes

Si vous rencontrez des erreurs lors de l'exécution des scripts, vérifiez les points suivants :

1. Assurez-vous que vos informations d'authentification Cloudflare sont correctes
2. Vérifiez que l'ID de zone est correct pour votre domaine
3. Assurez-vous que votre compte Cloudflare a les permissions nécessaires pour créer des règles

Pour plus d'informations, consultez la [documentation de l'API Cloudflare](https://api.cloudflare.com/).
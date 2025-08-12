# Configuration IPN PayDunya/Wave pour Longrich

Ce document explique comment configurer et utiliser l'IPN (Instant Payment Notification) pour le système de paiement Longrich avec PayDunya/Wave.

## 🎯 Objectif

L'IPN permet de recevoir des notifications instantanées de PayDunya lorsqu'un paiement change de statut (réussi, annulé, échoué), garantissant ainsi que votre système est toujours synchronisé avec l'état réel des paiements.

## 📋 Prérequis

1. Compte PayDunya configuré
2. Clés API PayDunya (Master Key, Public Key, Private Key, Token)
3. Serveur accessible depuis Internet (pour recevoir les notifications)

## 🚀 Installation et Configuration

### 1. Configuration des variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```bash
# Configuration PayDunya/Wave pour IPN
PAYDUNYA_MASTER_KEY=your_paydunya_master_key_here
PAYDUNYA_PUBLIC_KEY=your_paydunya_public_key_here
PAYDUNYA_PRIVATE_KEY=your_paydunya_private_key_here
PAYDUNYA_TOKEN=your_paydunya_token_here

# URL de base pour les callbacks IPN
IPN_BASE_URL=https://api.longrich.online
```

### 2. Configuration dans PayDunya

Dans votre tableau de bord PayDunya :

1. Allez dans **Paramètres** > **API & Webhooks**
2. Configurez l'URL IPN : `https://api.longrich.online/api/ipn/paydunya-ipn`
3. Activez les notifications pour tous les événements de paiement

### 3. Démarrage du serveur

Le serveur inclut automatiquement les routes IPN. Aucune configuration supplémentaire n'est nécessaire.

## 🧪 Tests

### Test rapide

```bash
# Vérifier que l'endpoint IPN est accessible
curl https://api.longrich.online/api/ipn/test-ipn
```

### Tests complets

```bash
# Exécuter le script de test bash
./scripts/wave_test_ipn.sh

# Ou exécuter les tests Node.js
node scripts/test-ipn.js
```

## 📡 Endpoints disponibles

### 1. Endpoint principal IPN
- **URL** : `POST /api/ipn/paydunya-ipn`
- **Description** : Reçoit les notifications PayDunya
- **Sécurité** : Vérification automatique de la signature hash

### 2. Endpoint de test
- **URL** : `GET /api/ipn/test-ipn`
- **Description** : Vérifie que l'IPN est fonctionnel

### 3. Statut de paiement
- **URL** : `GET /api/ipn/payment-status/:token`
- **Description** : Récupère le statut d'un paiement

## 🔒 Sécurité

### Vérification de signature

L'IPN vérifie automatiquement que les notifications proviennent bien de PayDunya en :
1. Calculant le hash SHA-512 de votre Master Key
2. Comparant avec le hash reçu de PayDunya
3. Rejetant les requêtes avec signature invalide (HTTP 403)

### Protection des endpoints

Les endpoints IPN sont automatiquement autorisés dans le middleware de sécurité, mais restent protégés par la vérification de signature.

## 📊 Statuts de paiement

| Statut | Description | Action automatique |
|--------|-------------|-------------------|
| `completed` | Paiement réussi | Marquer la commande comme payée |
| `cancelled` | Paiement annulé | Libérer l'inventaire réservé |
| `failed` | Paiement échoué | Proposer de réessayer |

## 🔧 Personnalisation

Pour personnaliser le traitement des paiements, modifiez les fonctions dans `/server/routes/ipn.js` :

```javascript
// Paiements réussis
function handleSuccessfulPayment(paymentData) {
  // Votre logique personnalisée
  // - Envoyer email de confirmation
  // - Déclencher la livraison
  // - Mettre à jour la base de données
}

// Paiements annulés
function handleCancelledPayment(paymentData) {
  // Votre logique personnalisée
  // - Libérer l'inventaire
  // - Notifier le client
}

// Paiements échoués
function handleFailedPayment(paymentData) {
  // Votre logique personnalisée
  // - Proposer de réessayer
  // - Analyser la cause de l'échec
}
```

## 📝 Logs et monitoring

L'IPN génère des logs détaillés :

```
[IPN] Notification IPN reçue de PayDunya
[IPN] Signature hash vérifiée avec succès
[IPN] Paiement réussi pour le token: test_abc123
[IPN] Client: Jean Dupont (774563209)
[IPN] Montant: 25000 FCFA
```

## 🐛 Dépannage

### Problèmes courants

1. **Hash invalide**
   - Vérifiez que `PAYDUNYA_MASTER_KEY` est correcte
   - Assurez-vous qu'il n'y a pas d'espaces en début/fin

2. **Endpoint non accessible**
   - Vérifiez que l'URL IPN est correcte dans PayDunya
   - Testez l'accessibilité : `curl https://api.longrich.online/api/ipn/test-ipn`

3. **Notifications non reçues**
   - Vérifiez les logs du serveur
   - Testez avec le script de test
   - Vérifiez la configuration dans PayDunya

### Commandes de diagnostic

```bash
# Vérifier les variables d'environnement
echo "Master Key: ${PAYDUNYA_MASTER_KEY:0:10}..."
echo "IPN URL: $IPN_BASE_URL"

# Tester l'endpoint
curl -v https://api.longrich.online/api/ipn/test-ipn

# Vérifier les logs du serveur
tail -f logs/server.log | grep IPN
```

## 🔄 Intégration avec la base de données

Pour une intégration complète, vous devrez :

1. **Créer une table de notifications**
```sql
CREATE TABLE payment_notifications (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  receipt_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Implémenter les fonctions de base de données**
```javascript
async function savePaymentNotification(paymentData) {
  // Sauvegarder la notification en base
}

async function updateOrderStatus(token, status) {
  // Mettre à jour le statut de la commande
}
```

## 📞 Support

En cas de problème :

1. Consultez les logs du serveur
2. Exécutez les scripts de test
3. Vérifiez la configuration PayDunya
4. Contactez le support technique si nécessaire

## 🎉 Félicitations !

Votre système IPN PayDunya/Wave est maintenant configuré et prêt à recevoir les notifications de paiement en temps réel ! 🚀
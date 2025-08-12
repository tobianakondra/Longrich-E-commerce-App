# Configuration IPN (Instant Payment Notification) pour PayDunya/Wave

Ce document explique comment configurer et utiliser l'IPN (Instant Payment Notification) pour recevoir les notifications de paiement en temps réel de PayDunya/Wave.

## Qu'est-ce que l'IPN ?

L'IPN (Instant Payment Notification) est un mécanisme qui permet à PayDunya de notifier instantanément votre serveur lorsqu'un paiement est confirmé, annulé ou échoué. Cela garantit que vous recevez les informations de transaction même si l'utilisateur ferme son navigateur avant la fin du processus de paiement.

## Configuration

### 1. Variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env` :

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

Dans votre tableau de bord PayDunya, configurez l'URL IPN comme suit :

```
https://api.longrich.online/api/ipn/paydunya-ipn
```

Cette URL sera appelée par PayDunya à chaque changement de statut de paiement.

## Endpoints disponibles

### 1. Endpoint principal IPN

**POST** `/api/ipn/paydunya-ipn`

Cet endpoint reçoit les notifications de PayDunya. Il :
- Vérifie la signature hash pour s'assurer que la requête provient de PayDunya
- Traite les données de paiement selon le statut (completed, cancelled, failed)
- Répond à PayDunya avec un statut de succès ou d'erreur

### 2. Endpoint de test

**GET** `/api/ipn/test-ipn`

Permet de vérifier que l'endpoint IPN est fonctionnel.

Réponse :
```json
{
  "status": "success",
  "message": "Endpoint IPN fonctionnel",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

### 3. Endpoint de statut de paiement

**GET** `/api/ipn/payment-status/:token`

Permet de récupérer le statut d'un paiement par son token.

## Structure des données IPN

PayDunya envoie les données suivantes via POST :

```json
{
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "hash": "8c6666a27fe5daeb76dae6abc7308a557dca5be1bda85dfe5d81fa330cdc0bc3c4b37765fe5d2cc36aa2ba0f9284226a80f5488d14740fa70769d6079a179406",
    "invoice": {
      "token": "test_jkEdPY8SuG",
      "total_amount": "42300",
      "description": "Paiement de 42300 FCFA pour article(s) achetés sur Longrich",
      "items": {
        "item_0": {
          "name": "Produit Longrich",
          "quantity": "1",
          "unit_price": "42300",
          "total_price": "42300",
          "description": "Description du produit"
        }
      }
    },
    "status": "completed",
    "customer": {
      "name": "Client Longrich",
      "phone": "774563209",
      "email": "client@example.com"
    },
    "receipt_url": "https://paydunya.com/sandbox-checkout/receipt/pdf/test_jkEdPY8SuG.pdf"
  }
}
```

## Statuts de paiement

- **completed** : Paiement réussi
- **cancelled** : Paiement annulé par l'utilisateur
- **failed** : Paiement échoué (problème technique, fonds insuffisants, etc.)

## Sécurité

### Vérification de la signature

L'IPN vérifie automatiquement la signature hash envoyée par PayDunya pour s'assurer que :
1. La requête provient bien des serveurs PayDunya
2. Les données n'ont pas été modifiées en transit

La vérification utilise l'algorithme SHA-512 avec votre `PAYDUNYA_MASTER_KEY`.

### Protection contre les attaques

- Les endpoints IPN sont automatiquement autorisés dans le middleware de sécurité
- La vérification de signature empêche les tentatives de fraude
- Les erreurs sont loggées pour le monitoring

## Implémentation personnalisée

Pour personnaliser le traitement des paiements, modifiez les fonctions suivantes dans `/server/routes/ipn.js` :

### Paiements réussis
```javascript
function handleSuccessfulPayment(paymentData) {
  // Votre logique personnalisée ici
  // - Marquer la commande comme payée
  // - Envoyer un email de confirmation
  // - Déclencher le processus de livraison
  // - Mettre à jour l'inventaire
}
```

### Paiements annulés
```javascript
function handleCancelledPayment(paymentData) {
  // Votre logique personnalisée ici
  // - Marquer la commande comme annulée
  // - Libérer l'inventaire réservé
  // - Envoyer une notification au client
}
```

### Paiements échoués
```javascript
function handleFailedPayment(paymentData) {
  // Votre logique personnalisée ici
  // - Marquer la commande comme échouée
  // - Libérer l'inventaire réservé
  // - Proposer de réessayer le paiement
}
```

## Tests

### Test local

1. Démarrez votre serveur en mode développement
2. Utilisez ngrok ou un service similaire pour exposer votre serveur local
3. Configurez l'URL IPN dans PayDunya avec l'URL ngrok
4. Effectuez un paiement test

### Test de l'endpoint

```bash
# Vérifier que l'endpoint IPN est accessible
curl https://api.longrich.online/api/ipn/test-ipn

# Réponse attendue :
{
  "status": "success",
  "message": "Endpoint IPN fonctionnel",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production"
}
```

## Logs et monitoring

L'IPN génère des logs détaillés pour le monitoring :

```
[IPN] Notification IPN reçue de PayDunya
[IPN] Signature hash vérifiée avec succès
[IPN] Paiement réussi pour le token: test_jkEdPY8SuG
[IPN] Client: Client Longrich (774563209)
[IPN] Montant: 42300 FCFA
```

## Dépannage

### Problèmes courants

1. **Hash invalide** : Vérifiez que `PAYDUNYA_MASTER_KEY` est correctement configurée
2. **Endpoint non accessible** : Vérifiez que l'URL IPN est correctement configurée dans PayDunya
3. **Données manquantes** : Vérifiez les logs pour identifier les champs manquants

### Vérification de la configuration

```bash
# Vérifier que les variables d'environnement sont définies
echo $PAYDUNYA_MASTER_KEY
echo $IPN_BASE_URL

# Tester l'accessibilité de l'endpoint
curl -X POST https://api.longrich.online/api/ipn/paydunya-ipn \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Intégration avec la base de données

Pour une intégration complète, vous devrez :

1. Créer une table pour stocker les statuts de paiement
2. Implémenter les fonctions de mise à jour de la base de données
3. Ajouter la gestion des erreurs et des retry
4. Implémenter les notifications email/SMS

Exemple de structure de table :

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Cette configuration vous permettra de recevoir et traiter automatiquement toutes les notifications de paiement de PayDunya/Wave.
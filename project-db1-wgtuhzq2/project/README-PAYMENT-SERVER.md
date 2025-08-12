# Serveur de Paiement Sécurisé - Longrich

Ce serveur gère les paiements Wave pour l'application Longrich. Il implémente une protection CSRF robuste et exécute le script `wave_test.sh` pour générer des liens de paiement.

## Configuration requise

- Node.js v14+ et npm
- curl (pour les requêtes HTTP dans le script `wave_test.sh`)
- Le script `wave_test.sh` doit être placé dans le répertoire `scripts/`

## Installation

1. Installez les dépendances :

```bash
npm install express cors helmet express-session cookie-parser csurf uuid morgan
```

2. Assurez-vous que le script `wave_test.sh` est présent dans le répertoire `scripts/` et qu'il a les permissions d'exécution.

## Structure des fichiers

```
project/
├── server/
│   ├── server.js       # Serveur Express principal
│   └── start.js        # Script de démarrage avec vérifications
├── scripts/
│   ├── wave_test.sh    # Script de paiement Wave
│   └── start-payment-server.js  # Script pour démarrer le serveur
└── src/
    └── components/
        └── CheckoutModal.tsx  # Composant React pour le modal de paiement
```

## Démarrage du serveur

```bash
node scripts/start-payment-server.js
```

Le serveur démarrera sur le port 4000 par défaut. Vous pouvez modifier le port en définissant la variable d'environnement `PORT`.

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

## Sécurité

Le serveur implémente plusieurs mesures de sécurité :

1. **Protection CSRF** : Utilisation de tokens CSRF avec expiration
2. **Cookies sécurisés** : Cookies HttpOnly et SameSite
3. **Validation des entrées** : Validation du numéro de téléphone, de la région, etc.
4. **Timeout** : Limite de temps pour l'exécution du script de paiement
5. **Journalisation** : Logs des événements sans données sensibles
6. **Headers de sécurité** : Via Helmet.js

## Intégration avec le frontend

Le composant `CheckoutModal.tsx` gère l'interface utilisateur pour la saisie des informations de paiement et communique avec le serveur de paiement.

Pour l'intégrer dans votre application React :

```jsx
import CheckoutModal from './components/CheckoutModal';

function App() {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  return (
    <div>
      <button onClick={() => setIsCheckoutModalOpen(true)}>
        Payer maintenant
      </button>
      
      <CheckoutModal 
        isOpen={isCheckoutModalOpen} 
        onClose={() => setIsCheckoutModalOpen(false)} 
      />
    </div>
  );
}
```

## Dépannage

### Le serveur ne démarre pas

1. Vérifiez que le script `wave_test.sh` est présent dans le répertoire `scripts/`
2. Vérifiez que le script a les permissions d'exécution : `chmod +x scripts/wave_test.sh`
3. Assurez-vous que curl est installé : `which curl`

### Erreur CSRF

Si vous recevez une erreur 403 avec le message "Formulaire expiré ou non valide", c'est que le token CSRF est invalide ou expiré. Obtenez un nouveau token via l'endpoint `/api/csrf-token`.

### Problèmes de paiement

Si le script de paiement échoue, vérifiez les logs du serveur pour plus de détails. Assurez-vous que les clés API dans `wave_test.sh` sont correctes et que le script fonctionne correctement en l'exécutant manuellement.

## Licence

Ce code est propriétaire et confidentiel. Tous droits réservés. 
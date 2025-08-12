# Longrich E-commerce

Application e-commerce pour Longrich développée avec React, TypeScript et Firebase.

## Configuration de la sécurité de l'administration

L'interface d'administration est protégée par un système de double authentification :
1. Authentification Firebase classique (email/mot de passe)
2. Code secret spécifique à chaque administrateur

### Configuration des règles Firestore

Pour que le système fonctionne correctement, vous devez déployer les règles Firestore incluses dans le fichier `firestore.rules` à la racine du projet. Ces règles définissent les permissions d'accès aux différentes collections de la base de données.

Pour déployer les règles :
```bash
firebase deploy --only firestore:rules
```

### Configuration du premier administrateur

Pour configurer le premier utilisateur administrateur, suivez ces étapes :

1. Assurez-vous que l'utilisateur est déjà inscrit dans votre application (avec email/mot de passe)
2. Récupérez l'ID de l'utilisateur depuis la console Firebase Authentication
3. Connectez-vous à l'application avec ce compte
4. Ouvrez la console du navigateur (F12 ou Ctrl+Shift+I)
5. Exécutez le code suivant en remplaçant les valeurs :

```javascript
// Importez la fonction setupFirstAdmin
import { setupFirstAdmin } from './utils/setupAdmin';

// Remplacez USER_ID par l'ID de l'utilisateur
// Remplacez YOUR_SECRET_CODE par un code secret fort (au moins 6 caractères)
setupFirstAdmin("USER_ID", "YOUR_SECRET_CODE");
```

6. Vous devriez voir un message de confirmation dans la console

### Accès à l'interface d'administration

Une fois configuré, l'accès à l'interface d'administration se fait en deux étapes :

1. Connectez-vous normalement à l'application avec votre compte administrateur
2. Accédez à l'URL d'administration : `/dashboard-management-secure-x29a7b`
3. Entrez votre code secret lorsqu'il est demandé

### Sécurité et limitations

Le système de sécurité implémente les fonctionnalités suivantes :

- **Limitation des tentatives** : Après 3 tentatives incorrectes, l'accès est bloqué pendant 15 minutes
- **Journalisation des accès** : Toutes les tentatives d'accès (réussies ou échouées) sont enregistrées
- **URL obscurcie** : L'URL d'administration est complexe et difficile à deviner
- **Double authentification** : Deux facteurs sont nécessaires pour accéder à l'interface

### Gestion des administrateurs

Pour configurer d'autres administrateurs, un administrateur existant doit :

1. Accéder à l'interface d'administration
2. Utiliser les fonctions d'administration pour attribuer le rôle "admin" à un utilisateur
3. Définir un code secret pour ce nouvel administrateur

### Modification du code secret

Les administrateurs peuvent modifier leur code secret via l'onglet "Sécurité" du tableau de bord d'administration. Le code secret doit :

- Contenir au moins 6 caractères
- Être suffisamment complexe (combinaison de lettres, chiffres et caractères spéciaux recommandée)
- Être changé régulièrement pour maintenir un niveau de sécurité élevé

### Résolution des problèmes courants

#### Erreur "Missing or insufficient permissions"

Si vous rencontrez cette erreur lors de la journalisation des accès, vérifiez que :
1. Les règles Firestore ont bien été déployées
2. La collection `access_logs` existe dans votre base de données Firestore
3. L'utilisateur a les permissions nécessaires selon les règles définies

#### Compte bloqué après trop de tentatives

Si votre compte est temporairement bloqué :
1. Attendez la fin de la période de blocage (15 minutes par défaut)
2. Reconnectez-vous et utilisez le bon code secret
3. Si le problème persiste, un autre administrateur peut réinitialiser vos tentatives via la fonction `resetAdminFailedAttempts`

#### Code secret oublié

Si vous avez oublié votre code secret :
1. Un autre administrateur doit vous attribuer un nouveau code via la fonction `changeAdminSecretCode`
2. Si vous êtes le seul administrateur, vous devrez modifier manuellement votre document utilisateur dans Firestore 
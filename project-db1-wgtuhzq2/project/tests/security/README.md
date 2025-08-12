# Tests des règles de sécurité Firebase avec App Check

Ce répertoire contient des tests pour vérifier que les règles de sécurité Firebase (Firestore et Storage) fonctionnent correctement avec l'intégration d'App Check.

## Objectif des tests

Ces tests vérifient que :

1. Les requêtes sans token App Check valide sont rejetées
2. Les requêtes avec token App Check valide sont acceptées (si les autres conditions sont remplies)
3. Les règles de sécurité existantes continuent de fonctionner correctement avec App Check

## Structure des tests

- `firestore.rules.test.js` : Tests pour les règles Firestore
- `storage.rules.test.js` : Tests pour les règles Storage

## Exécution des tests

Pour exécuter les tests, utilisez la commande suivante :

```bash
npm run test:rules
```

## Scénarios testés

### Firestore

1. **Collection users**
   - Un utilisateur non authentifié ne peut pas lire les utilisateurs, même avec App Check
   - Un utilisateur authentifié peut lire son propre document avec App Check valide
   - Un utilisateur authentifié ne peut pas lire son propre document sans App Check valide
   - Un utilisateur authentifié ne peut pas lire le document d'un autre utilisateur, même avec App Check
   - Un admin peut supprimer un utilisateur avec App Check valide
   - Un admin ne peut pas supprimer un utilisateur sans App Check valide

2. **Collection products**
   - N'importe qui peut lire les produits avec App Check valide
   - Personne ne peut lire les produits sans App Check valide
   - Un admin peut créer un produit avec App Check valide
   - Un admin ne peut pas créer un produit sans App Check valide
   - Un utilisateur normal ne peut pas créer un produit, même avec App Check valide

3. **Collection orders**
   - Un utilisateur peut lire sa propre commande avec App Check valide
   - Un utilisateur ne peut pas lire sa propre commande sans App Check valide
   - Un utilisateur peut créer une commande pour lui-même avec App Check valide
   - Un utilisateur ne peut pas créer une commande pour un autre utilisateur, même avec App Check valide
   - Un admin peut mettre à jour n'importe quelle commande avec App Check valide
   - Un admin ne peut pas mettre à jour une commande sans App Check valide

4. **Collection access_logs**
   - Un utilisateur authentifié peut créer un log avec App Check valide
   - Un utilisateur authentifié ne peut pas créer un log sans App Check valide
   - Un utilisateur authentifié ne peut pas modifier un log existant, même avec App Check valide

### Storage

1. **Accès en lecture**
   - N'importe qui peut lire un fichier avec App Check valide
   - Personne ne peut lire un fichier sans App Check valide
   - Un utilisateur authentifié peut lire un fichier avec App Check valide
   - Un utilisateur authentifié ne peut pas lire un fichier sans App Check valide

2. **Accès en écriture**
   - Un utilisateur non authentifié ne peut pas écrire un fichier, même avec App Check valide
   - Un utilisateur authentifié peut écrire un fichier avec App Check valide
   - Un utilisateur authentifié ne peut pas écrire un fichier sans App Check valide
   - Un utilisateur authentifié peut écrire dans son dossier personnel avec App Check valide

3. **Scénarios spécifiques**
   - Un utilisateur authentifié peut supprimer son propre fichier avec App Check valide
   - Un utilisateur authentifié ne peut pas supprimer le fichier d'un autre utilisateur, même avec App Check valide

## Interprétation des résultats

- Si tous les tests passent, cela signifie que les règles de sécurité sont correctement configurées pour exiger App Check
- Si certains tests échouent, vérifiez les messages d'erreur pour comprendre pourquoi et ajustez les règles en conséquence
# 🤝 Collaboration Frontend-Backend : Le Flux de Commande

Ce document explique comment le **CheckoutModal** (Frontend) et le **Serveur Node.js** (Backend) travaillent en équipe pour garantir des transactions fiables et sécurisées.

## 1. La Division du Travail (Qui fait quoi ?)

Le système repose sur un principe de **responsabilité partagée** :

| Responsabilité | Acteur | Pourquoi ? |
| :--- | :--- | :--- |
| **Collecte des données** | Frontend (`CheckoutModal.tsx`) | C'est là que l'utilisateur saisit son nom, son quartier et voit ses produits. |
| **Empaquetage** | Frontend (`CheckoutModal.tsx`) | Le front regroupe l'ID de l'utilisateur, ses articles et ses infos dans un objet JSON unique. |
| **Sécurisation (CSRF)** | Frontend & Backend | Avant d'envoyer la commande, le front demande un jeton secret au serveur pour prouver que la requête n'est pas une fraude. |
| **Source de Vérité** | Backend (`server.js`) | Le serveur possède les droits "Admin". C'est lui qui a le droit final d'écrire dans la collection globale `orders`. |
| **Scellement du Paiement** | Backend & SenePay | Le serveur communique l'ID de la commande à SenePay. Le montant est alors "verrouillé" et ne peut plus être modifié par le client. |

---

## 2. Analyse détaillée du Flux de Données

### Étape A : La Préparation (Frontend)
Lorsque vous cliquez sur "Payer maintenant", le code récupère :
*   `currentUser.uid` : L'identité de l'acheteur.
*   `items` : Le contenu exact du panier (nom, prix, quantité).
*   `formData` : Le numéro de téléphone et l'adresse de livraison.

### Étape B : La Transmission (Le Pont)
Ces données sont envoyées via une requête sécurisée à `https://api.longrich.online/api/checkout`. 

### Étape C : La Création du Document (Backend)
Le serveur reçoit les données et crée **immédiatement** un document dans Firestore :
*   Il utilise `FieldValue.serverTimestamp()` pour avoir l'heure exacte du serveur.
*   Il enregistre le détail des produits. Même si l'utilisateur vide son panier après avoir payé, la commande reste gravée dans Firestore.
*   Le statut initial est mis à `pending` (en attente) et `unpaid` (non payé).

### Étape D : L'Initiation du Paiement (Backend)
Le serveur demande à SenePay de générer un lien Wave. Il lui donne l'**ID du document Firestore** que nous venons de créer. C'est le lien de parenté entre l'argent (SenePay) et la marchandise (Firestore).

---

## 3. La Robustesse du Code (Les "Fallbacks")

Vous remarquerez des lignes comme `req.body.customerName || 'Client'`. 
*   **Le rôle :** C'est une sécurité "au cas où". Si un bug empêche le nom du client de voyager du front vers le back, le serveur ne s'arrête pas, il enregistre "Client" par défaut.
*   **La liste des produits :** De même, `items: req.body.items || []` garantit que la base de données reste structurée même si la liste est mal transmise.

## 4. Maintenance & Evolution

Pour redémarrer le système sans interrompre les clients qui sont en train de remplir le modal :
```bash
pm2 reload longrich-api
```

---

*Document généré le 7 Juin 2026. Ce guide assure la compréhension de la chaîne de valeur du projet Longrich.*

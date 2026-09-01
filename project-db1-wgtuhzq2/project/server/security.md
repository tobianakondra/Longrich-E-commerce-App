# Rapport d'Incident de Sécurité : Révocation de Clés API Exposées

## 1. Informations Générales
* **Date de l'incident :**  septembre 2025
* **Date de détection :** 1 septembre 2026
* **Statut :** Résolu ✅
* **Sévérité :** Élevée (Données de production potentiellement exposées)
* **Rédacteur :** Richard

---

## 2. Description de l'Incident
Lors d'un audit de l'historique Git, j'avais constaté qu'un fichier de configuration environnemental (`.env`) contenant des identifiants sensibles avait été inclus par inadvertance dans un commit historique (datant d'environ un an) sur la branche principale (`main`).

### Secrets concernés :
* **Clés API Twilio** (Identifiants de compte et jetons d'authentification).
* **Compte de service Firebase (Service Account JSON)** (Accès complet à la base de données et aux services Cloud associés).

Bien que le dépôt ne présente pas de signes d'intrusion active, la présence de ces secrets dans l'historique Git constituait une vulnérabilité majeure (risque d'aspiration automatisée par des robots de scan de dépôts).

---

## 3. Actions Correctives Immédiates
Afin de neutraliser la menace sans altérer l'intégrité de l'historique de production, les contre-mesures suivantes ont été appliquées immédiatement :

### Révocation des Clés
* **Firebase / Google Cloud Platform (GCP) :** L'intégralité des clés privées associées au compte de service compromis a été définitivement **supprimée** depuis la console Google Cloud IAM. Le jeton exposé est désormais invalide (`403 Forbidden`).
* **Twilio :** Les jetons d'authentification (Auth Tokens) exposés ont été **révoqués** et invalidés depuis le tableau de bord de sécurité Twilio.

### Sécurisation du Projet Local
* Génération de nouvelles clés privées distinctes pour Firebase et Twilio.
* Vérification et mise à jour du fichier `.gitignore` afin de garantir l'exclusion stricte du fichier `.env` pour tous les commits futurs.

---

## 4. Analyse et Conclusion
La suppression des clés côté fournisseur (Google et Twilio) invalide techniquement les données présentes dans l'historique Git. Même si l'ancien commit contenant le fichier `.env` reste visible localement ou en ligne, **les identifiants qu'il contient sont totalement inertes et inutilisables par un attaquant**.

L'application est désormais sécurisée et fonctionne exclusivement avec la nouvelle rotation de clés de sécurité.

---

## 5. Recommandations pour le Futur
1. Ne jamais versionner de fichiers `.env` ou contenant le mot `secret`.
2. Utiliser un outil de pré-commit comme `gitleaks` ou `trufflehog` pour bloquer automatiquement l'envoi de secrets en local avant qu'ils n'atteignent Git.
3. Utiliser des variables d'environnement injectées par la plateforme d'hébergement pour les environnements de production.

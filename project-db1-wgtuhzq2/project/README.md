# 🌿 Longrich E-commerce - Boutique Officielle Sénégal

Une plateforme e-commerce moderne, sécurisée et optimisée pour la vente de produits de santé et de bien-être Longrich.

## 🚀 Vision du Projet
Longrich n'est pas seulement une boutique en ligne ; c'est un écosystème basé sur la **consommation intelligente** et la **recommandation naturelle**. Notre plateforme facilite cet échange en offrant une expérience utilisateur fluide, de la découverte des produits jusqu'au paiement sécurisé.

---

## ✨ Fonctionnalités Clés

### 🛒 Expérience Client
*   **Catalogue Dynamique :** Gestion en temps réel des produits via Firestore.
*   **SEO Avancé :** Pré-rendu statique dynamique (Prerendering) pour une indexation parfaite par Google et des partages riches sur WhatsApp/Facebook (Open Graph).
*   **Paiement Local :** Intégration directe avec **SenePay** pour des paiements via **Wave** et **Orange Money**.
*   **Notifications Temps Réel :** Utilisation des **Server-Sent Events (SSE)** pour confirmer instantanément le succès d'un paiement sans rechargement.

### 🔐 Sécurité & Infrastructure
*   **Firebase App Check :** Protection contre les bots et les accès non autorisés via reCAPTCHA v3.
*   **Forteresse Backend :** Proxy Node.js/Express gérant les opérations sensibles (clés secrètes, transactions).
*   **Politique CSP Stricte :** Protection contre les injections XSS et les scripts malveillants.
*   **Admin 2FA :** Accès au tableau de bord protégé par authentification Firebase et code secret administrateur.

### 🖼️ Gestion des Médias
*   **Optimisation Uploadcare :** Migration totale des images Base64 vers un CDN professionnel.
*   **Auto-Healing des données :** Nettoyage automatique des anciens paniers contenant du Base64, remplacé dynamiquement par les URLs CDN lors de la consultation.
*   **Upload Différé :** Prévisualisation locale instantanée et envoi au cloud uniquement lors de la validation finale.

---

## 🛠️ Stack Technique

*   **Frontend :** React 18, TypeScript, Vite, Tailwind CSS.
*   **Backend :** Node.js, Express (Proxy de paiement sécurisé).
*   **Database :** Google Firebase Firestore.
*   **Auth :** Firebase Authentication.
*   **Cloud :** Cloudflare (WAF & DNS), Uploadcare (CDN Images).

---

## 🛠️ Installation & Maintenance

### Pré-requis
*   Node.js (v18+)
*   Firebase CLI
*   Un compte SenePay et Uploadcare

### Lancement en développement
```bash
# Frontend
npm install
npm run dev

# Backend
cd server
npm install
node server.js
```

### Build & Déploiement
Le projet utilise un pipeline de build sophistiqué incluant le SEO :
```bash
npm run build && firebase deploy
```

Pour plus de détails sur la maintenance des clés et de la sécurité, consultez [MAINTENANCE_SECURITE.md](./MAINTENANCE_SECURITE.md).

---

## 📝 Licence
Ce projet est privé et destiné à l'usage exclusif de la boutique Longrich Sénégal.

*Généré avec soin pour assurer la durabilité et la performance de la plateforme Longrich.*

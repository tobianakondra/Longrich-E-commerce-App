# 🛍️ Boutique Beauté — Application E-commerce Moderne

Une application e-commerce moderne développée avec **React**, **TypeScript**, **TailwindCSS** et **Firebase**, initialement générée avec **Bolt.new** puis migrée dans **Cursor AI** pour développement avancé.

---

## 🔧 Stack Technique

- ⚛️ React + TypeScript
- 🎨 TailwindCSS
- 🔐 Firebase Authentication (Email / Mot de passe)
- 📦 Gestion de panier locale
- 🗂️ react-router-dom
- 🧪 Tests (optionnel)

---

## 🎯 Fonctionnalités

- Authentification via Firebase (email / mot de passe, avec affichage mot de passe et confirmation)
- Page d’accueil avec :
  - Produits phares
  - Offres spéciales
- Page Produits avec filtres :
  - Santé, Soins du corps, Soins du visage, Beauté, Bien-être
- Cartes produit stylisées (image, prix FCFA, réduction %, bouton "Ajouter au panier")
- Panier avec :
  - Incrémentateur de quantité
  - Total dynamique
  - Boutons : "Continuer mes achats" et "Passer la commande"
- Pages additionnelles :
  - À propos
  - Contact (formulaire + carte Google Maps)
  - Politique de confidentialité
- Design responsive et thème en **dégradé rose violacé**

---

## 📁 Structure de Dossiers

```bash
src/               # Images, logos, icônes
├── components/
├── Cart/                  # Gestion du panier
├── Layout/                # Contient le Header et le footer
├── Product                # Cartes des produits, Filtres etc
├── Config/                # Configuration firebase
├── Contexts/              # Authentification et Panier
├── data/                  # Contient les donnes des produits (images,titre,prix,..)  
├── pages/                 # Pages principales du site (Home, Products, Cart, etc.)



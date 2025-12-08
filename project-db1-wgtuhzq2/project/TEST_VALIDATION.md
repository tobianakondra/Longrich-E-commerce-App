# 🧪 Guide de Test - Validation des Entrées

## Tests Manuels Rapides

### 1. Test du Formulaire de Contact

**Accès**: Aller sur la page Contact

#### Test 1: Injection XSS
```
Nom: <script>alert('XSS')</script>
Email: test@example.com
Message: Ceci est un message de test valide pour vérifier la sécurité
```
**Résultat attendu**: Le script doit être supprimé, seul le texte reste

#### Test 2: Nom invalide
```
Nom: A
Email: test@example.com
Message: Message de test valide
```
**Résultat attendu**: Erreur "Le nom doit contenir entre 2 et 50 caractères"

#### Test 3: Email invalide
```
Nom: Jean Dupont
Email: invalid-email
Message: Message de test valide
```
**Résultat attendu**: Erreur "Adresse email invalide"

#### Test 4: Message trop court
```
Nom: Jean Dupont
Email: test@example.com
Message: Court
```
**Résultat attendu**: Erreur "Le message doit contenir entre 10 et 1000 caractères"

#### Test 5: Validation réussie
```
Nom: Jean Dupont
Email: test@example.com
Message: Ceci est un message de test valide pour vérifier que tout fonctionne correctement
```
**Résultat attendu**: ✅ Message envoyé avec succès

---

### 2. Test du Champ Quartier (Commande)

**Accès**: Ajouter un produit au panier → Passer commande

#### Test 1: Quartier avec HTML
```
Quartier: Plateau<script>alert('test')</script>
```
**Résultat attendu**: Le script est supprimé, reste "Plateau"

#### Test 2: Quartier trop court
```
Quartier: A
```
**Résultat attendu**: Erreur lors de la soumission

#### Test 3: Quartier valide
```
Quartier: Plateau, Rue 123
```
**Résultat attendu**: ✅ Accepté

#### Test 4: Caractères spéciaux invalides
```
Quartier: Test<>'"
```
**Résultat attendu**: Caractères dangereux supprimés

---

### 3. Test de la Recherche de Produits

**Accès**: Page Produits → Barre de recherche

#### Test 1: Recherche avec script
```
Recherche: <script>alert('XSS')</script>shampoing
```
**Résultat attendu**: Script supprimé, recherche "shampoing"

#### Test 2: Recherche trop longue
```
Recherche: [Taper plus de 100 caractères]
```
**Résultat attendu**: Tronqué à 100 caractères

#### Test 3: Recherche valide
```
Recherche: crème visage
```
**Résultat attendu**: ✅ Résultats affichés

---

## Tests avec DevTools

### Test Console (Chrome/Firefox)

1. Ouvrir DevTools (F12)
2. Aller dans Console
3. Tester la fonction de validation:

```javascript
// Importer la fonction (si disponible dans window)
// Ou tester directement dans les formulaires

// Test 1: Entrer du HTML dans un champ
document.querySelector('input[name="name"]').value = '<script>alert("test")</script>';
// Déclencher onChange
document.querySelector('input[name="name"]').dispatchEvent(new Event('input', { bubbles: true }));
// Vérifier que le script a été supprimé
console.log(document.querySelector('input[name="name"]').value);
```

---

## Tests Backend (avec curl ou Postman)

### Test 1: Quartier invalide

```bash
curl -X POST http://localhost:4000/api/checkout \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: [VOTRE_TOKEN]" \
  -d '{
    "phoneNumber": "771234567",
    "region": "Dakar",
    "quartier": "A",
    "amount": 5000
  }'
```
**Résultat attendu**: Erreur 400 "Quartier invalide"

### Test 2: Montant invalide

```bash
curl -X POST http://localhost:4000/api/checkout \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: [VOTRE_TOKEN]" \
  -d '{
    "phoneNumber": "771234567",
    "region": "Dakar",
    "quartier": "Plateau",
    "amount": -100
  }'
```
**Résultat attendu**: Erreur 400 "Montant invalide"

### Test 3: Injection dans quartier

```bash
curl -X POST http://localhost:4000/api/checkout \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: [VOTRE_TOKEN]" \
  -d '{
    "phoneNumber": "771234567",
    "region": "Dakar",
    "quartier": "<script>alert(\"XSS\")</script>Plateau",
    "amount": 5000
  }'
```
**Résultat attendu**: Script supprimé, quartier sanitisé

### Test 4: Requête trop grande

```bash
curl -X POST http://localhost:4000/api/checkout \
  -H "Content-Type: application/json" \
  -H "CSRF-Token: [VOTRE_TOKEN]" \
  -d '{
    "phoneNumber": "771234567",
    "region": "Dakar",
    "quartier": "[STRING DE 20KB]",
    "amount": 5000
  }'
```
**Résultat attendu**: Erreur 413 "Payload Too Large"

---

## Checklist de Test Rapide

### Frontend
- [ ] Formulaire contact: nom invalide bloqué
- [ ] Formulaire contact: email invalide bloqué
- [ ] Formulaire contact: message trop court bloqué
- [ ] Formulaire contact: script XSS supprimé
- [ ] Formulaire contact: compteur de caractères fonctionne
- [ ] Quartier: caractères invalides supprimés
- [ ] Quartier: longueur limitée à 100
- [ ] Recherche: script XSS supprimé
- [ ] Recherche: longueur limitée à 100

### Backend
- [ ] Quartier invalide rejeté (400)
- [ ] Montant négatif rejeté (400)
- [ ] Montant trop grand rejeté (400)
- [ ] Script dans quartier sanitisé
- [ ] Requête > 10KB rejetée (413)
- [ ] Description trop longue rejetée (400)

---

## Tests Automatisés (Optionnel)

Si Jest est configuré:

```bash
# Lancer les tests unitaires
npm test inputValidation

# Lancer tous les tests
npm test
```

---

## Résultats Attendus

### ✅ Tous les tests passent
- Aucune injection XSS possible
- Aucune injection SQL/NoSQL possible
- Limites de longueur respectées
- Validation côté client ET serveur
- Messages d'erreur clairs

### ❌ Si un test échoue
1. Vérifier que les dépendances sont installées
2. Vérifier que les imports sont corrects
3. Consulter la console pour les erreurs
4. Vérifier SECURITE_VALIDATION_IMPLEMENTEE.md

---

## Support

En cas de problème:
1. Vérifier les logs de la console (F12)
2. Vérifier les logs du serveur
3. Consulter SECURITE_VALIDATION_IMPLEMENTEE.md
4. Vérifier que toutes les dépendances sont installées

---

**Date**: 8 décembre 2025  
**Version**: 1.0

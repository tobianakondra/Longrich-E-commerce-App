# 🔒 Rapport d'Audit de Sécurité - Validation des Entrées Utilisateur

**Date**: 8 décembre 2025  
**Projet**: Longrich E-commerce Application  
**Statut**: ⚠️ VULNÉRABILITÉS CRITIQUES DÉTECTÉES

---

## 📊 Résumé Exécutif

### ✅ Points Positifs
- React 18.3.1 installé (protégé contre React2Shell)
- Firebase mis à jour vers 11.10.0
- Protection CSRF implémentée
- Validation de format pour les numéros de téléphone
- Rate limiting sur l'endpoint SMS config

### ❌ Vulnérabilités Critiques Identifiées

1. **AUCUNE SANITISATION DES ENTRÉES UTILISATEUR** 🔴
2. **Pas de validation côté serveur pour plusieurs champs** 🔴
3. **Injection XSS possible** 🔴
4. **Injection NoSQL possible via Firebase** 🟡
5. **Pas de limitation de longueur des champs** 🟡

---

## 🔍 Analyse Détaillée

### 1. Formulaire de Contact (`Contact.tsx`)

**Problèmes identifiés:**
```typescript
// ❌ AUCUNE SANITISATION
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value  // ⚠️ Accepte n'importe quoi
  });
};
```

**Risques:**
- ✗ Injection de scripts malveillants (XSS)
- ✗ Pas de limite de longueur
- ✗ Pas de validation d'email côté client avancée
- ✗ Pas de protection contre les caractères spéciaux

**Données vulnérables:**
- `name` - Accepte n'importe quel caractère
- `email` - Validation HTML5 uniquement (insuffisante)
- `message` - Aucune limite ni sanitisation

---

### 2. Formulaire de Checkout (`CheckoutModal.tsx`)

**Problèmes identifiés:**

```typescript
// ✅ Validation du téléphone (BON)
const validatePhone = (phone: string): boolean => {
  const cleanedPhone = phone.replace(/\s+|-|\(|\)|\+/g, '');
  const phoneRegex = /^(77|78|76|70|75)[0-9]{7}$/;
  return phoneRegex.test(cleanedPhone) && cleanedPhone.length === 9;
};

// ❌ Mais le champ "quartier" n'est PAS validé
<input
  type="text"
  id="quartier"
  name="quartier"
  value={formData.quartier}
  onChange={handleChange}  // ⚠️ Accepte n'importe quoi
/>
```

**Risques:**
- ✓ Téléphone: Bien validé
- ✗ Quartier: Aucune validation (injection possible)
- ✗ Région: Validation côté client uniquement

---

### 3. Serveur Backend (`server.js`)

**Validation côté serveur:**

```javascript
// ✅ Validation du téléphone (BON)
const validatePhoneNumber = (phone) => {
  let cleanedPhone = phone.replace(/\s+|-|\(|\)|\+/g, '');
  if (cleanedPhone.startsWith('221')) {
    cleanedPhone = cleanedPhone.substring(3);
  }
  const regex = /^(77|78|76|70|75)[0-9]{7}$/;
  return regex.test(cleanedPhone) && cleanedPhone.length === 9;
};

// ❌ Validation insuffisante dans /api/checkout
app.post('/api/checkout', csrfProtection, async (req, res) => {
  const { phoneNumber, region, quartier, amount, description } = req.body;

  // Validation minimale
  if (!phoneNumber || !region || !quartier || !amount) {
    return res.status(400).json({ error: 'Données de formulaire incomplètes' });
  }

  // ⚠️ Pas de sanitisation de "quartier"
  // ⚠️ Pas de validation de "description"
  // ⚠️ Pas de limite de longueur
});
```

**Risques:**
- ✗ `quartier` - Aucune sanitisation (injection possible)
- ✗ `description` - Aucune validation
- ✗ Pas de protection contre les injections NoSQL
- ✗ Pas de limite de taille des requêtes

---

### 4. Authentification (Login/Register)

**Problèmes identifiés:**

```typescript
// ❌ Pas de validation avancée du mot de passe
<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}  // ⚠️ Accepte n'importe quoi
  placeholder="Minimum 6 caractères"
/>
```

**Risques:**
- ✗ Pas de vérification de complexité du mot de passe
- ✗ Pas de protection contre les mots de passe communs
- ✗ Username non sanitisé

---

## 🛡️ Recommandations de Sécurité

### PRIORITÉ 1 - CRITIQUE (À corriger immédiatement)

#### 1. Installer une bibliothèque de sanitisation

```bash
npm install dompurify validator
npm install --save-dev @types/dompurify @types/validator
```

#### 2. Créer un utilitaire de validation

Créer `src/utils/validation.ts`:
```typescript
import DOMPurify from 'dompurify';
import validator from 'validator';

export const sanitizeInput = (input: string, maxLength: number = 500): string => {
  // Nettoyer les balises HTML et scripts
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // Limiter la longueur
  return cleaned.substring(0, maxLength).trim();
};

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email) && email.length <= 254;
};

export const validateName = (name: string): boolean => {
  // Seulement lettres, espaces, tirets et apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  return nameRegex.test(name);
};

export const validateQuartier = (quartier: string): boolean => {
  // Lettres, chiffres, espaces et quelques caractères spéciaux
  const quartierRegex = /^[a-zA-Z0-9À-ÿ\s,.-]{2,100}$/;
  return quartierRegex.test(quartier);
};
```

#### 3. Mettre à jour le formulaire de Contact

```typescript
import { sanitizeInput, validateEmail, validateName } from '../utils/validation';

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  
  let sanitizedValue = value;
  
  // Sanitiser selon le type de champ
  switch(name) {
    case 'name':
      sanitizedValue = sanitizeInput(value, 50);
      if (!validateName(sanitizedValue) && sanitizedValue.length > 0) {
        setError('Le nom contient des caractères invalides');
        return;
      }
      break;
    case 'email':
      sanitizedValue = sanitizeInput(value, 254);
      if (!validateEmail(sanitizedValue) && sanitizedValue.length > 0) {
        setError('Email invalide');
        return;
      }
      break;
    case 'message':
      sanitizedValue = sanitizeInput(value, 1000);
      break;
  }
  
  setFormData({
    ...formData,
    [name]: sanitizedValue
  });
};
```

#### 4. Mettre à jour le CheckoutModal

```typescript
import { sanitizeInput, validateQuartier } from '../utils/validation';

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  
  if (name === 'quartier') {
    const sanitized = sanitizeInput(value, 100);
    if (!validateQuartier(sanitized) && sanitized.length > 0) {
      setError('Le quartier contient des caractères invalides');
      return;
    }
    setFormData({ ...formData, quartier: sanitized });
  }
  // ... reste du code
};
```

#### 5. Validation côté serveur (CRITIQUE)

Créer `server/utils/validation.js`:
```javascript
import validator from 'validator';

export const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== 'string') return '';
  
  // Supprimer les caractères dangereux
  const cleaned = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  
  return cleaned.substring(0, maxLength);
};

export const validateQuartier = (quartier) => {
  if (!quartier || typeof quartier !== 'string') return false;
  
  const regex = /^[a-zA-Z0-9À-ÿ\s,.-]{2,100}$/;
  return regex.test(quartier) && quartier.length >= 2 && quartier.length <= 100;
};

export const validateAmount = (amount) => {
  const num = Number(amount);
  return !isNaN(num) && num > 0 && num <= 10000000; // Max 10M FCFA
};
```

Mettre à jour `/api/checkout`:
```javascript
import { sanitizeString, validateQuartier, validateAmount } from './utils/validation.js';

app.post('/api/checkout', csrfProtection, async (req, res) => {
  const { phoneNumber, region, quartier, amount, description } = req.body;

  // Validation et sanitisation
  if (!phoneNumber || !region || !quartier || !amount) {
    return res.status(400).json({ error: 'Données de formulaire incomplètes' });
  }

  // Sanitiser les entrées
  const sanitizedQuartier = sanitizeString(quartier, 100);
  const sanitizedDescription = sanitizeString(description, 500);

  // Valider le quartier
  if (!validateQuartier(sanitizedQuartier)) {
    return res.status(400).json({ error: 'Quartier invalide' });
  }

  // Valider le montant
  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  // Valider le téléphone
  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  // Valider la région
  if (!regions.includes(region)) {
    return res.status(400).json({ error: 'Région invalide' });
  }

  // Continuer avec les données sanitisées...
});
```

---

### PRIORITÉ 2 - IMPORTANTE

#### 6. Ajouter une limite de taille des requêtes

```javascript
// Dans server.js
app.use(express.json({ limit: '10kb' })); // Limiter à 10KB
```

#### 7. Ajouter un rate limiting global

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

app.use('/api/', limiter);
```

#### 8. Validation des mots de passe

```typescript
export const validatePassword = (password: string): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

---

## 📋 Checklist de Sécurité

### Frontend
- [ ] Installer DOMPurify et validator
- [ ] Créer utils/validation.ts
- [ ] Sanitiser tous les champs de formulaire
- [ ] Valider les emails avec validator
- [ ] Limiter la longueur des champs
- [ ] Ajouter validation de mot de passe fort
- [ ] Afficher des messages d'erreur clairs

### Backend
- [ ] Créer utils/validation.js
- [ ] Sanitiser toutes les entrées dans /api/checkout
- [ ] Valider le quartier côté serveur
- [ ] Valider le montant (min/max)
- [ ] Limiter la taille des requêtes (10KB)
- [ ] Ajouter rate limiting global
- [ ] Logger les tentatives d'injection
- [ ] Ajouter validation pour /api/send-verification
- [ ] Ajouter validation pour /api/verify-code

### Tests
- [ ] Tester injection XSS dans tous les champs
- [ ] Tester injection SQL/NoSQL
- [ ] Tester dépassement de longueur
- [ ] Tester caractères spéciaux
- [ ] Tester rate limiting
- [ ] Tester validation de mot de passe

---

## 🎯 Impact Estimé

**Sans corrections:**
- Risque d'injection XSS: **ÉLEVÉ** 🔴
- Risque d'injection NoSQL: **MOYEN** 🟡
- Risque de DoS: **MOYEN** 🟡

**Avec corrections:**
- Risque d'injection XSS: **FAIBLE** 🟢
- Risque d'injection NoSQL: **TRÈS FAIBLE** 🟢
- Risque de DoS: **FAIBLE** 🟢

---

## 📞 Actions Immédiates Requises

1. **Installer les dépendances de sécurité** (5 min)
2. **Créer les utilitaires de validation** (30 min)
3. **Mettre à jour les formulaires** (1h)
4. **Mettre à jour le serveur** (1h)
5. **Tester toutes les entrées** (1h)

**Temps total estimé: 3h30**

---

## 📚 Ressources

- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Validator.js Documentation](https://github.com/validatorjs/validator.js)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

---

**Rapport généré le**: 8 décembre 2025  
**Prochaine révision recommandée**: Après implémentation des corrections

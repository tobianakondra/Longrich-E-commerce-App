/**
 * Utilitaires de validation et sanitisation des entrées utilisateur
 * Protection contre XSS, injection, et autres attaques
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * Sanitise une chaîne de caractères en supprimant tout HTML/script
 * @param input - La chaîne à nettoyer
 * @param maxLength - Longueur maximale autorisée
 * @returns La chaîne nettoyée et tronquée
 */
export const sanitizeInput = (input: string, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Nettoyer les balises HTML et scripts
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
  
  // Limiter la longueur et supprimer les espaces superflus
  return cleaned.substring(0, maxLength).trim();
};

/**
 * Valide un email
 * @param email - L'email à valider
 * @returns true si l'email est valide
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Utiliser validator.js pour une validation robuste
  return validator.isEmail(email) && email.length <= 254;
};

/**
 * Valide un nom (prénom, nom complet)
 * @param name - Le nom à valider
 * @returns true si le nom est valide
 */
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  // Autoriser lettres (avec accents), espaces, tirets et apostrophes
  // Longueur: 2-50 caractères
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Valide un message (commentaire, description)
 * @param message - Le message à valider
 * @returns true si le message est valide
 */
export const validateMessage = (message: string): boolean => {
  if (!message || typeof message !== 'string') return false;
  
  const trimmed = message.trim();
  // Minimum 10 caractères, maximum 1000
  return trimmed.length >= 10 && trimmed.length <= 1000;
};

/**
 * Valide un quartier (adresse)
 * @param quartier - Le quartier à valider
 * @returns true si le quartier est valide
 */
export const validateQuartier = (quartier: string): boolean => {
  if (!quartier || typeof quartier !== 'string') return false;
  
  // Autoriser lettres, chiffres, espaces et quelques caractères spéciaux
  // Longueur: 2-100 caractères
  const quartierRegex = /^[a-zA-Z0-9À-ÿ\s,.\-/()]{2,100}$/;
  return quartierRegex.test(quartier.trim());
};

/**
 * Valide une recherche de produit
 * @param searchTerm - Le terme de recherche
 * @returns true si le terme est valide
 */
export const validateSearchTerm = (searchTerm: string): boolean => {
  if (!searchTerm || typeof searchTerm !== 'string') return false;
  
  const trimmed = searchTerm.trim();
  
  // Minimum 1 caractère, maximum 100
  if (trimmed.length < 1 || trimmed.length > 100) return false;
  
  // Autoriser lettres, chiffres, espaces et quelques caractères spéciaux
  const searchRegex = /^[a-zA-Z0-9À-ÿ\s\-'.,&]+$/;
  return searchRegex.test(trimmed);
};

/**
 * Sanitise et valide un champ de formulaire
 * @param value - La valeur à valider
 * @param type - Le type de validation à appliquer
 * @returns Objet avec la valeur sanitisée et le statut de validation
 */
export const sanitizeAndValidate = (
  value: string, 
  type: 'name' | 'email' | 'message' | 'quartier' | 'search'
): { value: string; isValid: boolean; error?: string } => {
  
  let maxLength: number;
  let validator: (val: string) => boolean;
  let errorMessage: string;
  
  switch (type) {
    case 'name':
      maxLength = 50;
      validator = validateName;
      errorMessage = 'Le nom doit contenir entre 2 et 50 caractères (lettres, espaces, tirets et apostrophes uniquement)';
      break;
      
    case 'email':
      maxLength = 254;
      validator = validateEmail;
      errorMessage = 'Adresse email invalide';
      break;
      
    case 'message':
      maxLength = 1000;
      validator = validateMessage;
      errorMessage = 'Le message doit contenir entre 10 et 1000 caractères';
      break;
      
    case 'quartier':
      maxLength = 100;
      validator = validateQuartier;
      errorMessage = 'Le quartier doit contenir entre 2 et 100 caractères (lettres, chiffres et caractères spéciaux basiques)';
      break;
      
    case 'search':
      maxLength = 100;
      validator = validateSearchTerm;
      errorMessage = 'La recherche doit contenir entre 1 et 100 caractères';
      break;
      
    default:
      maxLength = 500;
      validator = () => true;
      errorMessage = 'Valeur invalide';
  }
  
  // Sanitiser d'abord
  const sanitized = sanitizeInput(value, maxLength);
  
  // Puis valider
  const isValid = validator(sanitized);
  
  return {
    value: sanitized,
    isValid,
    error: isValid ? undefined : errorMessage
  };
};

/**
 * Échappe les caractères spéciaux pour les requêtes
 * @param str - La chaîne à échapper
 * @returns La chaîne échappée
 */
export const escapeSpecialChars = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '') // Supprimer < et >
    .replace(/['"]/g, '') // Supprimer guillemets
    .replace(/[\\]/g, ''); // Supprimer backslash
};

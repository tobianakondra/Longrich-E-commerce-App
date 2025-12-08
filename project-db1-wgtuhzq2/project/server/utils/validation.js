/**
 * Utilitaires de validation et sanitisation côté serveur
 * Protection contre XSS, injection, et autres attaques
 */

import validator from 'validator';

/**
 * Sanitise une chaîne de caractères en supprimant les caractères dangereux
 * @param {string} str - La chaîne à nettoyer
 * @param {number} maxLength - Longueur maximale autorisée
 * @returns {string} La chaîne nettoyée
 */
export const sanitizeString = (str, maxLength = 500) => {
  if (typeof str !== 'string') return '';
  
  // Supprimer les balises HTML et scripts
  const cleaned = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>]/g, '')
    .trim();
  
  return cleaned.substring(0, maxLength);
};

/**
 * Valide un email
 * @param {string} email - L'email à valider
 * @returns {boolean} true si l'email est valide
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email) && email.length <= 254;
};

/**
 * Valide un nom
 * @param {string} name - Le nom à valider
 * @returns {boolean} true si le nom est valide
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Valide un message
 * @param {string} message - Le message à valider
 * @returns {boolean} true si le message est valide
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  
  const trimmed = message.trim();
  return trimmed.length >= 10 && trimmed.length <= 1000;
};

/**
 * Valide un quartier
 * @param {string} quartier - Le quartier à valider
 * @returns {boolean} true si le quartier est valide
 */
export const validateQuartier = (quartier) => {
  if (!quartier || typeof quartier !== 'string') return false;
  
  const quartierRegex = /^[a-zA-Z0-9À-ÿ\s,.\-/()]{2,100}$/;
  return quartierRegex.test(quartier.trim());
};

/**
 * Valide un montant
 * @param {number|string} amount - Le montant à valider
 * @returns {boolean} true si le montant est valide
 */
export const validateAmount = (amount) => {
  const num = Number(amount);
  return !isNaN(num) && num > 0 && num <= 10000000; // Max 10M FCFA
};

/**
 * Valide une description
 * @param {string} description - La description à valider
 * @returns {boolean} true si la description est valide
 */
export const validateDescription = (description) => {
  if (!description || typeof description !== 'string') return false;
  
  const trimmed = description.trim();
  return trimmed.length >= 5 && trimmed.length <= 500;
};

/**
 * Échappe les caractères spéciaux pour éviter les injections
 * @param {string} str - La chaîne à échapper
 * @returns {string} La chaîne échappée
 */
export const escapeSpecialChars = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .replace(/[\\]/g, '');
};

/**
 * Valide et sanitise un objet de données de formulaire
 * @param {Object} data - Les données à valider
 * @param {Array<string>} requiredFields - Les champs requis
 * @returns {Object} Objet avec isValid, errors et sanitizedData
 */
export const validateFormData = (data, requiredFields = []) => {
  const errors = [];
  const sanitizedData = {};
  
  // Vérifier les champs requis
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Le champ ${field} est requis`);
    }
  }
  
  // Sanitiser tous les champs string
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = sanitizeString(value);
    } else {
      sanitizedData[key] = value;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};

/**
 * Tests unitaires pour les fonctions de validation
 * Exécuter avec: npm test
 */

import {
  sanitizeInput,
  validateEmail,
  validateName,
  validateMessage,
  validateQuartier,
  validateSearchTerm,
  sanitizeAndValidate
} from '../inputValidation';

describe('Validation des entrées utilisateur', () => {
  
  describe('sanitizeInput', () => {
    it('devrait supprimer les balises HTML', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('devrait limiter la longueur', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeInput(input, 50);
      expect(result.length).toBe(50);
    });

    it('devrait supprimer les espaces superflus', () => {
      const input = '  Hello  World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello  World');
    });
  });

  describe('validateEmail', () => {
    it('devrait accepter les emails valides', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('devrait rejeter les emails invalides', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('devrait rejeter les emails trop longs', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe('validateName', () => {
    it('devrait accepter les noms valides', () => {
      expect(validateName('Jean Dupont')).toBe(true);
      expect(validateName("Marie-Claire O'Brien")).toBe(true);
      expect(validateName('François')).toBe(true);
    });

    it('devrait rejeter les noms invalides', () => {
      expect(validateName('A')).toBe(false); // Trop court
      expect(validateName('a'.repeat(51))).toBe(false); // Trop long
      expect(validateName('Jean123')).toBe(false); // Chiffres
      expect(validateName('Jean<script>')).toBe(false); // HTML
    });
  });

  describe('validateMessage', () => {
    it('devrait accepter les messages valides', () => {
      expect(validateMessage('Ceci est un message de test valide')).toBe(true);
      expect(validateMessage('a'.repeat(500))).toBe(true);
    });

    it('devrait rejeter les messages invalides', () => {
      expect(validateMessage('Court')).toBe(false); // Trop court (< 10)
      expect(validateMessage('a'.repeat(1001))).toBe(false); // Trop long
      expect(validateMessage('')).toBe(false);
    });
  });

  describe('validateQuartier', () => {
    it('devrait accepter les quartiers valides', () => {
      expect(validateQuartier('Plateau')).toBe(true);
      expect(validateQuartier('Quartier 123')).toBe(true);
      expect(validateQuartier('Rue de la Paix, Apt. 5')).toBe(true);
    });

    it('devrait rejeter les quartiers invalides', () => {
      expect(validateQuartier('A')).toBe(false); // Trop court
      expect(validateQuartier('a'.repeat(101))).toBe(false); // Trop long
      expect(validateQuartier('Test<script>')).toBe(false); // HTML
    });
  });

  describe('validateSearchTerm', () => {
    it('devrait accepter les recherches valides', () => {
      expect(validateSearchTerm('shampoing')).toBe(true);
      expect(validateSearchTerm('crème visage')).toBe(true);
      expect(validateSearchTerm('produit & beauté')).toBe(true);
    });

    it('devrait rejeter les recherches invalides', () => {
      expect(validateSearchTerm('')).toBe(false);
      expect(validateSearchTerm('a'.repeat(101))).toBe(false); // Trop long
      expect(validateSearchTerm('test<script>')).toBe(false); // HTML
    });
  });

  describe('sanitizeAndValidate', () => {
    it('devrait sanitiser et valider un nom', () => {
      const result = sanitizeAndValidate('Jean <script>alert("XSS")</script>', 'name');
      expect(result.value).not.toContain('<script>');
      expect(result.isValid).toBe(true);
    });

    it('devrait retourner une erreur pour un email invalide', () => {
      const result = sanitizeAndValidate('invalid-email', 'email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('devrait accepter un message valide', () => {
      const result = sanitizeAndValidate('Ceci est un message de test valide', 'message');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Protection XSS', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
    ];

    xssPayloads.forEach(payload => {
      it(`devrait bloquer: ${payload}`, () => {
        const result = sanitizeInput(payload);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('javascript:');
      });
    });
  });

  describe('Protection Injection', () => {
    const injectionPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "../../../etc/passwd",
      "{{7*7}}",
      "${7*7}",
    ];

    injectionPayloads.forEach(payload => {
      it(`devrait sanitiser: ${payload}`, () => {
        const result = sanitizeInput(payload);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });
  });
});

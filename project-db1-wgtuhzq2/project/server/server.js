import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createWavePayment, checkPaymentStatus } from './services/paymentService.js';
import fetch from 'node-fetch';
import twilio from 'twilio';
import https from 'https';
import http from 'http';
import { paymentAccessFix } from './middleware/paymentAccessFix.js';
import ipnRoutes from './routes/ipn.js';
import sseRoutes from './routes/sse.js';
import pollingRoutes from './routes/polling.js';
import sseService from './services/sseService.js';
import admin from 'firebase-admin';

// Charger les variables d'environnement
dotenv.config();

// Configuration Firebase Admin
if (!admin.apps.length) {
  try {
    // Utiliser la clé de service depuis les variables d'environnement
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✅ Firebase Admin initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin:', error);
  }
}

// Obtenir le chemin du répertoire actuel en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const app = express();
const PORT = process.env.PORT || 4000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialisation du client Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Middleware de base avec limite de taille
app.use(express.json({ limit: '10kb' })); // Limiter la taille des requêtes JSON à 10KB
app.use(cookieParser());

// ========================================
// ROUTES IPN - AVANT TOUS LES MIDDLEWARES DE SÉCURITÉ
// ========================================
console.log('🔧 Configuration des routes IPN AVANT tous les middlewares de sécurité...');
app.use('/api/ipn', ipnRoutes);
console.log('✅ Routes IPN configurées et accessibles sans restrictions');

// ========================================
// ENDPOINT IPN DIRECT AVEC LE MÊME PATTERN QUE PAYMENT-PROXY
// ========================================
app.post('/payment-ipn-webhook', express.json(), async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[PAYMENT-IPN-WEBHOOK] ${timestamp} - Notification IPN reçue de PayDunya`);
    console.log('[PAYMENT-IPN-WEBHOOK] IP source:', req.ip || req.connection.remoteAddress);
    console.log('[PAYMENT-IPN-WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[PAYMENT-IPN-WEBHOOK] Body complet:', JSON.stringify(req.body, null, 2));
    
    // Répondre immédiatement pour tester
    res.status(200).json({ 
      status: 'success',
      message: 'IPN webhook reçu avec succès',
      timestamp: new Date().toISOString(),
      path: req.path
    });
    
  } catch (error) {
    console.error('[PAYMENT-IPN-WEBHOOK] Erreur:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erreur webhook',
      error: error.message
    });
  }
});

// Test de l'endpoint IPN avec le pattern payment-*
app.get('/payment-ipn-test', (req, res) => {
  console.log('[PAYMENT-IPN-TEST] Test endpoint appelé');
  res.json({
    status: 'success',
    message: 'Endpoint IPN payment-* fonctionnel',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Appliquer le middleware de contournement pour les paiements AVANT tout autre middleware
app.use(paymentAccessFix);

// Middleware spécial pour les requêtes de paiement et IPN - BYPASS COMPLET
app.use((req, res, next) => {
  // Vérifier si c'est une requête de paiement, IPN ou SSE
  if (req.path.startsWith('/payment-proxy/') ||
    req.path.startsWith('/payment-content/') ||
    req.path.startsWith('/payment-success/') ||
    req.path.startsWith('/payment-ipn') ||
    req.path.startsWith('/api/ipn/') ||
    req.path.startsWith('/api/sse/') ||
    req.path === '/payment-error') {
    console.log(`[BYPASS COMPLET] Requête de paiement/IPN détectée: ${req.path}`);
    console.log(`[BYPASS COMPLET] Headers originaux: Origin=${req.headers.origin}, Referer=${req.headers.referer}`);

    // BYPASS COMPLET - passer directement au handler de route
    // Marquer la requête comme autorisée
    req.paymentBypass = true;

    return next();
  }

  // Pour les autres requêtes, continuer normalement
  next();
});

// Middleware pour vérifier les en-têtes Referer et Origin
app.use((req, res, next) => {
  // Log détaillé pour toutes les requêtes
  console.log(`Requête reçue - Path: ${req.path}, Method: ${req.method}, Origin: ${req.headers.origin}, Referer: ${req.headers.referer}`);

  // VÉRIFIER D'ABORD SI LA REQUÊTE A ÉTÉ MARQUÉE POUR BYPASS
  if (req.paymentBypass) {
    console.log(`[BYPASS CONFIRMÉ] Requête de paiement autorisée: ${req.path}`);
    return next();
  }

  // Toujours autoriser les URLs de paiement, les ressources statiques, les IPN et SSE sans vérification
  if (req.path.startsWith('/payment-proxy/') ||
    req.path.startsWith('/payment-content/') ||
    req.path.startsWith('/payment-success/') ||
    req.path.startsWith('/static/') ||
    req.path.startsWith('/c/') ||
    req.path.startsWith('/api/ipn/') ||
    req.path.startsWith('/api/sse/') ||
    req.path === '/payment-error') {
    console.log(`Autorisation automatique pour le chemin: ${req.path}`);
    return next();
  }

  const referer = req.headers.referer;
  const origin = req.headers.origin;

  // Liste des domaines autorisés
  const allowedDomains = [
    'longrich.online',
    'api.longrich.online',
    'longrich-3212d.web.app',
    'longrich-3212d.firebaseapp.com',
    'wave.com'
  ];

  // En mode développement, autoriser également les domaines locaux
  if (isDevelopment) {
    allowedDomains.push(
      'localhost:5173',
      'localhost:3000',
      'localhost:4000',
      'localhost:4001'
    );
  }

  // Vérifier si la requête provient d'un domaine autorisé
  // Ignorer pour les requêtes OPTIONS (pre-flight CORS)
  if (req.method !== 'OPTIONS') {
    let isAllowed = false;

    // Vérifier si c'est une requête sans référent (comme une requête API directe)
    if ((!referer || referer === 'null') && (!origin || origin === 'null')) {
      // Autoriser TOUTES les requêtes de paiement sans vérification d'en-têtes
      if (req.path.startsWith('/payment-proxy/')) {
        console.log(`Autorisation spéciale pour requête de paiement sans en-têtes: ${req.path}`);
        isAllowed = true;
      }

      // Autoriser TOUTES les requêtes IPN sans vérification d'en-têtes (comme PayDunya)
      if (req.path.startsWith('/api/ipn/')) {
        console.log(`Autorisation spéciale pour requête IPN sans en-têtes: ${req.path}`);
        isAllowed = true;
      }

      // Autoriser TOUTES les requêtes SSE sans vérification d'en-têtes
      if (req.path.startsWith('/api/sse/')) {
        console.log(`Autorisation spéciale pour requête SSE sans en-têtes: ${req.path}`);
        isAllowed = true;
      }

      // Autoriser les requêtes sans référent uniquement pour certains endpoints
      const publicEndpoints = ['/api/csrf-token', '/api/regions'];
      if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        isAllowed = true;
      }
    } else {
      // Vérifier si le référent ou l'origine contient un domaine autorisé
      isAllowed = allowedDomains.some(domain =>
        (referer && referer.includes(domain)) ||
        (origin && origin.includes(domain))
      );
    }

    // Si la requête n'est pas autorisée, la rejeter
    if (!isAllowed) {
      console.log(`Requête rejetée - Referer: ${referer}, Origin: ${origin}, Path: ${req.path}`);
      return res.status(403).json({ error: 'Accès refusé' });
    }
  }

  next();
});

// Configuration CORS
app.use(cors({
  origin: function (origin, callback) {
    // Liste des origines autorisées en production
    const allowedOrigins = [
      'https://longrich.online',
      'https://api.longrich.online',
      'https://longrich-3212d.web.app',
      'https://longrich-3212d.firebaseapp.com',
      'https://paydunya.com',
    ];

    // En mode développement, autoriser également les origines locales
    if (isDevelopment) {
      allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:3000',
        'https://localhost:5173',
        'https://localhost:3000'
      );
    }

    console.log('Origine de la requête:', origin);
    // Autoriser les requêtes sans origine (comme les appels API mobiles ou Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origine CORS bloquée:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'CSRF-Token']
}));

// Configuration Helmet améliorée
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://*.wave.com", "https://*.cloudflareinsights.com"],
      connectSrc: ["'self'", "https://longrich.online", "https://longrich-3212d.web.app", "https://longrich-3212d.firebaseapp.com", "https://pay.wave.com", "https://app.paydunya.com", "https://*.cloudflareinsights.com", "https://*.wave.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://*.wave.com", "https://pay.wave.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://*.cloudflareinsights.com", "https://static.cloudflareinsights.com", "https://*.wave.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://*.wave.com"],
      fontSrc: ["'self'", "data:", "https://*.wave.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: "deny"
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  }
}));

// Configuration de session
app.use(session({
  secret: process.env.SESSION_SECRET || uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Stockage des tokens CSRF
const csrfTokens = new Map();

// Stockage des paiements en cours
const pendingPayments = new Map();

// Rate limiting pour l'endpoint SMS config
const smsConfigRateLimitMap = new Map();
const SMS_CONFIG_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const SMS_CONFIG_MAX_REQUESTS = 10; // 10 requêtes par minute par IP

// Middleware de debug pour les requêtes
app.use((req, res, next) => {
  if (req.method === 'POST' || req.path === '/api/csrf-token') {
    console.log('Debug requête:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      csrfToken: req.headers['csrf-token'],
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Middleware de vérification CSRF personnalisé
const csrfProtection = (req, res, next) => {
  // Ignorer la vérification pour les requêtes GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['csrf-token'];

  console.log('Vérification CSRF:', {
    token,
    tokensValides: Array.from(csrfTokens.keys()),
    estValide: token && csrfTokens.has(token)
  });

  if (!token || !csrfTokens.has(token)) {
    console.log('Token CSRF invalide:', token);
    console.log('Tokens valides:', Array.from(csrfTokens.keys()));
    return res.status(403).json({ error: 'Accès non autorisé - Token CSRF invalide' });
  }

  // Token valide, continuer
  next();
};

// Endpoint pour obtenir un token CSRF
app.get('/api/csrf-token', (req, res) => {
  const token = uuidv4();

  // Stocker le token directement
  csrfTokens.set(token, true);

  console.log('Nouveau token CSRF généré:', token);
  console.log('Tokens valides après génération:', Array.from(csrfTokens.keys()));

  // Nettoyer les anciens tokens après 2 heures
  setTimeout(() => {
    if (csrfTokens.has(token)) {
      csrfTokens.delete(token);
      console.log('Token CSRF expiré et supprimé:', token);
    }
  }, 2 * 60 * 60 * 1000);

  // Définir les en-têtes CORS pour cette réponse spécifique
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({ csrfToken: token });
});

// Liste des régions du Sénégal
const regions = [
  'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack',
  'Kédougou', 'Kolda', 'Louga', 'Matam', 'Saint-Louis',
  'Sédhiou', 'Tambacounda', 'Thiès', 'Ziguinchor'
];

// Endpoint pour récupérer la liste des régions
app.get('/api/regions', (req, res) => {
  res.json({ regions });
});

// Cache pour la configuration SMS (évite de lire les variables d'environnement à chaque requête)
let smsConfigCache = null;
let smsConfigCacheTime = 0;
const SMS_CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware de rate limiting pour l'endpoint SMS config
const smsConfigRateLimit = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  const now = Date.now();

  // Nettoyer les anciennes entrées
  for (const [ip, data] of smsConfigRateLimitMap.entries()) {
    if (now - data.windowStart > SMS_CONFIG_RATE_LIMIT_WINDOW) {
      smsConfigRateLimitMap.delete(ip);
    }
  }

  // Vérifier le rate limit pour cette IP
  if (!smsConfigRateLimitMap.has(clientIp)) {
    smsConfigRateLimitMap.set(clientIp, {
      count: 1,
      windowStart: now
    });
  } else {
    const ipData = smsConfigRateLimitMap.get(clientIp);

    // Si nous sommes dans la même fenêtre de temps
    if (now - ipData.windowStart < SMS_CONFIG_RATE_LIMIT_WINDOW) {
      if (ipData.count >= SMS_CONFIG_MAX_REQUESTS) {
        console.log(`Rate limit dépassé pour l'IP ${clientIp} sur /api/sms-config`);
        return res.status(429).json({
          error: 'Trop de requêtes',
          message: 'Veuillez patienter avant de faire une nouvelle requête',
          retryAfter: Math.ceil((SMS_CONFIG_RATE_LIMIT_WINDOW - (now - ipData.windowStart)) / 1000)
        });
      }
      ipData.count++;
    } else {
      // Nouvelle fenêtre de temps
      ipData.count = 1;
      ipData.windowStart = now;
    }
  }

  next();
};

// Endpoint pour récupérer la configuration SMS avec rate limiting
app.get('/api/sms-config', smsConfigRateLimit, (req, res) => {
  try {
    const now = Date.now();

    // Vérifier si le cache est encore valide
    if (smsConfigCache && (now - smsConfigCacheTime) < SMS_CONFIG_CACHE_DURATION) {
      console.log('Configuration SMS servie depuis le cache');
      return res.json(smsConfigCache);
    }

    // Lire la configuration depuis les variables d'environnement
    const smsEnabled = process.env.SEND_TWILIO_CODE === 'true';

    // Créer la réponse de configuration
    const config = {
      smsEnabled,
      timestamp: new Date().toISOString()
    };

    // Mettre à jour le cache
    smsConfigCache = config;
    smsConfigCacheTime = now;

    console.log('Configuration SMS récupérée depuis l\'environnement:', config);

    // Définir les headers de cache pour le client (1 heure)
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-SMS-Config-Source', 'environment');

    res.json(config);
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration SMS:', error);

    // En cas d'erreur, retourner une configuration par défaut (SMS désactivé)
    const fallbackConfig = {
      smsEnabled: false,
      timestamp: new Date().toISOString(),
      error: 'Configuration par défaut utilisée'
    };

    res.setHeader('X-SMS-Config-Source', 'fallback');
    res.status(200).json(fallbackConfig);
  }
});

// Middleware pour valider le numéro de téléphone
const validatePhoneNumber = (phone) => {
  // Nettoyer le numéro de téléphone (supprimer espaces, tirets, etc.)
  let cleanedPhone = phone.replace(/\s+|-|\(|\)|\+/g, '');

  // Si le numéro commence par 221, le retirer pour la validation
  if (cleanedPhone.startsWith('221')) {
    cleanedPhone = cleanedPhone.substring(3);
  }

  console.log(`Validation du numéro: "${phone}" -> "${cleanedPhone}"`);

  // Vérifier que le numéro commence par 77, 78, 70, 75 ou 76 et a exactement 9 chiffres
  const regex = /^(77|78|76|70|75)[0-9]{7}$/;

  // Vérifier le format et la longueur
  return regex.test(cleanedPhone) && cleanedPhone.length === 9;
};

// Formater un numéro de téléphone sénégalais pour Twilio
const formatPhoneNumber = (phone) => {
  // Nettoyer le numéro
  let cleaned = phone.replace(/\s+|-|\(|\)|\+/g, '');

  // Si le numéro commence déjà par le code pays, le retourner tel quel
  if (cleaned.startsWith('221')) {
    return '+' + cleaned;
  }

  // Ajouter le code pays du Sénégal (+221)
  return '+221' + cleaned;
};

// Endpoint pour envoyer un code de vérification SMS
app.post('/api/send-verification', csrfProtection, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    console.log('Requête reçue pour envoi de code:', {
      phoneNumber,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'csrf-token': req.headers['csrf-token'],
        'origin': req.headers.origin
      }
    });

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de téléphone est requis'
      });
    }

    // Vérifier si la vérification SMS est activée
    const smsEnabled = process.env.SEND_TWILIO_CODE === 'true';

    if (!smsEnabled) {
      console.log('Vérification SMS désactivée - retour de succès simulé');
      return res.json({
        success: true,
        message: 'Vérification SMS désactivée - numéro accepté',
        bypassed: true,
        sid: 'bypassed-' + Date.now()
      });
    }

    // Valider le format du numéro de téléphone
    if (!validatePhoneNumber(phoneNumber)) {
      console.log(`Numéro invalide: "${phoneNumber}" - Format attendu: 9 chiffres commençant par 77, 78, 76, 70 ou 75`);
      return res.status(400).json({
        success: false,
        message: 'Format de numéro de téléphone invalide'
      });
    }

    // Formater le numéro pour Twilio
    const formattedPhone = formatPhoneNumber(phoneNumber);

    console.log(`Envoi d'un code de vérification à ${formattedPhone}`);

    // Envoyer le code de vérification via Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms',
        locale: 'fr'
      });

    console.log(`Code envoyé avec succès, SID: ${verification.sid}`);

    // Répondre avec succès
    res.json({
      success: true,
      message: 'Code de vérification envoyé avec succès',
      sid: verification.sid
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du code de vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du code de vérification',
      error: error.message
    });
  }
});

// Endpoint pour vérifier un code SMS
app.post('/api/verify-code', csrfProtection, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro de téléphone et le code sont requis'
      });
    }

    // Vérifier si la vérification SMS est activée
    const smsEnabled = process.env.SEND_TWILIO_CODE === 'true';

    if (!smsEnabled) {
      console.log('Vérification SMS désactivée - acceptation automatique du code');
      return res.json({
        success: true,
        message: 'Vérification SMS désactivée - code accepté automatiquement',
        status: 'bypassed',
        bypassed: true
      });
    }

    // Valider le format du numéro de téléphone
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Format de numéro de téléphone invalide'
      });
    }

    // Formater le numéro pour Twilio
    const formattedPhone = formatPhoneNumber(phoneNumber);

    console.log(`Vérification du code pour ${formattedPhone}`);

    // Vérifier le code via Twilio Verify
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhone,
        code: code
      });

    if (verificationCheck.status === 'approved') {
      console.log(`Code vérifié avec succès pour ${formattedPhone}`);
      res.json({
        success: true,
        message: 'Numéro de téléphone vérifié avec succès',
        status: verificationCheck.status
      });
    } else {
      console.log(`Échec de vérification pour ${formattedPhone}, statut: ${verificationCheck.status}`);
      res.json({
        success: false,
        message: 'Code de vérification invalide',
        status: verificationCheck.status
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code',
      error: error.message
    });
  }
});

// Importer les utilitaires de validation
import { 
  sanitizeString, 
  validateQuartier, 
  validateAmount, 
  validateDescription 
} from './utils/validation.js';

// Endpoint de checkout sécurisé
app.post('/api/checkout', csrfProtection, async (req, res) => {
  const { phoneNumber, region, quartier, amount, description } = req.body;

  // Validation des données
  if (!phoneNumber || !region || !quartier || !amount) {
    return res.status(400).json({ error: 'Données de formulaire incomplètes' });
  }

  // Sanitiser les entrées
  const sanitizedQuartier = sanitizeString(quartier, 100);
  const sanitizedDescription = description ? sanitizeString(description, 500) : '';

  // Valider le quartier
  if (!validateQuartier(sanitizedQuartier)) {
    return res.status(400).json({ 
      error: 'Quartier invalide. Utilisez uniquement des lettres, chiffres et caractères spéciaux basiques (2-100 caractères)' 
    });
  }

  // Valider le montant
  if (!validateAmount(amount)) {
    return res.status(400).json({ 
      error: 'Montant invalide. Le montant doit être entre 1 et 10,000,000 FCFA' 
    });
  }

  // Valider la description si fournie
  if (sanitizedDescription && !validateDescription(sanitizedDescription)) {
    return res.status(400).json({ 
      error: 'Description invalide. La description doit contenir entre 5 et 500 caractères' 
    });
  }

  // Valider le téléphone
  if (!validatePhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  // Valider la région
  if (!regions.includes(region)) {
    return res.status(400).json({ error: 'Région invalide' });
  }

  try {
    console.log(`Traitement de la commande pour ${region}, quartier: ${sanitizedQuartier}, montant: ${amount} FCFA`);

    const paymentUrl = await createWavePayment({
      amount,
      description: sanitizedDescription || `Commande Longrich - Région: ${region}`,
      customerName: `Client - ${region}`,
      customerPhone: phoneNumber,
      customerEmail: 'client@example.com'
    });

    console.log(`URL de paiement générée: ${paymentUrl}`);

    // Générer un ID de paiement unique
    const paymentId = uuidv4();

    // Stocker les informations de paiement
    pendingPayments.set(paymentId, {
      originalUrl: paymentUrl,
      amount,
      description: description || `Commande Longrich - Région: ${region}`,
      region,
      phoneNumber,
      createdAt: new Date().toISOString()
    });

    // Définir une expiration après 30 minutes
    setTimeout(() => {
      if (pendingPayments.has(paymentId)) {
        pendingPayments.delete(paymentId);
        console.log(`Paiement ${paymentId} expiré et supprimé`);
      }
    }, 30 * 60 * 1000);

    // Détecter si l'utilisateur est sur mobile ou desktop
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    console.log(`[CHECKOUT] User-Agent: ${userAgent}`);
    console.log(`[CHECKOUT] Détecté comme: ${isMobile ? 'Mobile' : 'Desktop'}`);

    // Stocker l'information dans les données de paiement
    pendingPayments.get(paymentId).isMobile = isMobile;
    pendingPayments.get(paymentId).userAgent = userAgent;

    // Renvoyer l'URL du proxy au lieu de l'URL Wave directe
    const proxyUrl = `${req.protocol}://${req.get('host')}/payment-proxy/${paymentId}?source=checkout&device=${isMobile ? 'mobile' : 'desktop'}`;
    res.json({ paymentUrl: proxyUrl });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur détaillée lors du traitement du paiement:`, error);

    // Envoyer une réponse d'erreur plus détaillée au client
    res.status(500).json({
      error: 'Erreur lors du traitement du paiement',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint pour vérifier le statut d'un paiement (optionnel)
app.get('/api/payment-status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token de paiement manquant' });
    }

    const status = await checkPaymentStatus(token);
    res.json(status);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur lors de la vérification du statut:`, error.message);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

// Endpoint de test CSRF
app.post('/api/csrf-test', csrfProtection, (req, res) => {
  res.json({ success: true, message: 'Protection CSRF fonctionnelle' });
});

// ========================================
// ROUTES SSE - Server-Sent Events
// ========================================
console.log('🔧 Configuration des routes SSE...');
app.use('/api/sse', sseRoutes);
console.log('✅ Routes SSE configurées pour les notifications temps réel');

// ========================================
// ROUTES POLLING - Payment Polling
// ========================================
console.log('🔧 Configuration des routes de polling...');
app.use('/api/polling', pollingRoutes);
console.log('✅ Routes de polling configurées pour la vérification des paiements');

// Middleware pour servir les ressources statiques de Wave
app.get('/static/*', async (req, res) => {
  try {
    // Ajouter des en-têtes CORS pour permettre l'accès depuis n'importe quel domaine
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin, Referer, User-Agent');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    const resourcePath = req.path; // Ex: /static/payez-avec-wave-stacked.svg

    console.log(`Requête pour ressource statique: ${resourcePath}`);

    // Ressources spécifiques à remplacer par des versions personnalisées
    const specificResources = {
      '/static/payez-avec-wave-stacked.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
        <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
          Payez avec Wave
        </text>
      </svg>`,
      '/static/camera-icon.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="white" d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/>
        <path fill="white" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      </svg>`,
      '/static/wave-logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">
        <text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
          WAVE
        </text>
      </svg>`
    };

    // Vérifier si c'est une ressource spécifique que nous pouvons remplacer
    if (specificResources[resourcePath]) {
      console.log(`Utilisation d'une ressource personnalisée pour: ${resourcePath}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache pendant 24 heures
      return res.send(specificResources[resourcePath]);
    }

    // Sinon, essayer de récupérer la ressource depuis Wave
    const waveBaseUrl = 'https://pay.wave.com'; // URL de base de Wave
    const waveResourceUrl = `${waveBaseUrl}${resourcePath}`;

    console.log(`Proxying resource: ${waveResourceUrl}`);

    // Récupérer la ressource depuis Wave avec des en-têtes améliorés
    console.log(`[STATIC RESOURCE] Tentative de récupération de: ${waveResourceUrl}`);

    const headers = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (compatible; WavePaymentProxy/1.0)',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': `${req.protocol}://${req.get('host')}`,
      'Referer': `${req.protocol}://${req.get('host')}/payment-proxy/`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    console.log(`[STATIC RESOURCE] En-têtes de requête:`, headers);

    const response = await fetch(waveResourceUrl, { headers });

    if (!response.ok) {
      console.error(`Erreur lors de la récupération de la ressource: ${response.status} ${response.statusText}`);

      // Renvoyer une image SVG générique pour les ressources SVG manquantes
      if (resourcePath.endsWith('.svg')) {
        console.log(`Génération d'une image SVG générique pour: ${resourcePath}`);

        // Créer une image SVG générique basée sur le nom de fichier
        const fileName = resourcePath.split('/').pop();
        const genericSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="#00bfff" />
          <text x="50%" y="50%" font-family="Arial" font-size="8" text-anchor="middle" dominant-baseline="middle" fill="white">
            ${fileName}
          </text>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache pendant 24 heures
        return res.send(genericSvg);
      } else if (resourcePath.endsWith('.png') || resourcePath.endsWith('.jpg') || resourcePath.endsWith('.jpeg')) {
        // Pour les images, renvoyer une image transparente 1x1
        const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        res.setHeader('Content-Type', resourcePath.endsWith('.png') ? 'image/png' : 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache pendant 24 heures
        return res.send(transparentPixel);
      }

      // Pour les autres types de ressources, renvoyer une erreur
      return res.status(404).send('Resource not found');
    }

    // Récupérer les headers de la réponse
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // Définir les headers de notre réponse
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Ajouter des headers de cache pour améliorer les performances
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // Cache pendant 24 heures
    res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString()); // Expire dans 24 heures

    // Si c'est une image SVG, récupérer le contenu en texte et le renvoyer
    if (contentType && contentType.includes('svg') || resourcePath.endsWith('.svg')) {
      const svgContent = await response.text();
      return res.send(svgContent);
    }

    // Pour les autres types de ressources, transférer directement le flux
    response.body.pipe(res);
  } catch (error) {
    console.error(`Erreur lors du proxy de la ressource:`, error);
    res.status(500).send('Error proxying resource');
  }
});

// Middleware pour servir les ressources de Wave avec des chemins complets
app.get('/c/*', async (req, res) => {
  try {
    const fullPath = req.path; // Ex: /c/cos-1yhwsswar1trg
    const waveBaseUrl = 'https://pay.wave.com';
    const waveResourceUrl = `${waveBaseUrl}${fullPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    console.log(`Proxying Wave resource: ${waveResourceUrl}`);

    // Récupérer la ressource depuis Wave avec les en-têtes Origin et Referer
    const response = await fetch(waveResourceUrl, {
      headers: {
        'Origin': `${req.protocol}://${req.get('host')}`,
        'Referer': `${req.protocol}://${req.get('host')}${req.path}`
      }
    });

    if (!response.ok) {
      console.error(`Erreur lors de la récupération de la ressource Wave: ${response.status} ${response.statusText}`);
      return res.status(response.status).send('Resource not found');
    }

    // Récupérer les headers de la réponse
    const contentType = response.headers.get('content-type');

    // Définir les headers de notre réponse
    res.setHeader('Content-Type', contentType || 'application/octet-stream');

    // Transférer directement le flux
    response.body.pipe(res);
  } catch (error) {
    console.error(`Erreur lors du proxy de la ressource Wave:`, error);
    res.status(500).send('Error proxying resource');
  }
});

// Fonction pour minifier et obfusquer le HTML
const obfuscateHtml = (html) => {
  // Supprimer les commentaires HTML
  let result = html.replace(/<!--[\s\S]*?-->/g, '');

  // Supprimer les espaces inutiles
  result = result.replace(/\s{2,}/g, ' ');

  // Supprimer les sauts de ligne
  result = result.replace(/\n/g, '');

  // Ajouter un script anti-inspection
  const antiInspectScript = `
  <script>
    // Anti-inspection et anti-débogage
    (function() {
      // Désactiver le clic droit
      document.addEventListener('contextmenu', e => e.preventDefault());
      
      // Désactiver la sélection de texte
      document.addEventListener('selectstart', e => e.preventDefault());
      
      // Détection de DevTools
      const devtools = {
        isOpen: false,
        orientation: undefined
      };
      
      // Fonction pour vérifier si DevTools est ouvert
      const checkDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
          if (!devtools.isOpen) {
            devtools.isOpen = true;
            // Action à effectuer si DevTools est ouvert
            window.location.href = '/security-violation';
          }
        } else {
          if (devtools.isOpen) {
            devtools.isOpen = false;
          }
        }
      };
      
      // Vérifier périodiquement
      setInterval(checkDevTools, 1000);
      
      // Désactiver les raccourcis clavier pour ouvrir DevTools
      window.addEventListener('keydown', (e) => {
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12
        if (
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
          e.keyCode === 123
        ) {
          e.preventDefault();
          window.location.href = '/security-violation';
        }
      });
    })();
  </script>
  `;

  // Injecter le script avant la fermeture de la balise body
  result = result.replace('</body>', `${antiInspectScript}</body>`);

  return result;
};

// Endpoint de proxy pour les paiements Wave - Bypass complet des vérifications de sécurité
app.get('/payment-proxy/:paymentId', (req, res, next) => {
  console.log(`Requête de proxy de paiement reçue - PaymentId: ${req.params.paymentId}, Source: ${req.query.source}`);
  console.log(`Headers de la requête: Origin=${req.headers.origin}, Referer=${req.headers.referer}`);

  // IMPORTANT: Marquer explicitement cette requête comme autorisée pour tous les middlewares
  req.paymentBypass = true;

  // Forcer l'ajout des en-têtes Origin et Referer s'ils sont manquants
  if (!req.headers.origin) {
    req.headers.origin = `${req.protocol}://${req.get('host')}`;
    console.log(`En-tête Origin ajouté manuellement: ${req.headers.origin}`);
  }

  if (!req.headers.referer) {
    req.headers.referer = `${req.protocol}://${req.get('host')}/payment-proxy/${req.params.paymentId}`;
    console.log(`En-tête Referer ajouté manuellement: ${req.headers.referer}`);
  }

  next();
}, async (req, res) => {
  const { paymentId } = req.params;
  const action = req.query.action;

  // Vérifier si le paiement existe
  if (!pendingPayments.has(paymentId)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur de paiement</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 {
            color: #dc3545;
            margin-top: 0;
          }
          .btn {
            display: inline-block;
            background-color: #7952b3;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
          }
          .btn:hover {
            background-color: #6741a2;
          }
          .icon {
            font-size: 64px;
            color: #dc3545;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Lien de paiement invalide</h1>
          <p>Ce lien de paiement a expiré ou n'existe pas.</p>
          <p>Veuillez retourner à la boutique pour créer une nouvelle commande.</p>
          <a href="https://longrich-3212d.web.app" class="btn">Retour à la boutique</a>
        </div>
      </body>
      </html>
    `);
  }

  const paymentInfo = pendingPayments.get(paymentId);

  // Si action=proceed, récupérer le contenu de la page Wave
  if (action === 'proceed') {
    try {
      // Détecter si l'utilisateur est sur mobile ou desktop
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      // Utiliser l'information stockée dans les données de paiement si disponible
      const deviceType = req.query.device || (paymentInfo.isMobile ? 'mobile' : 'desktop');

      console.log(`Récupération du contenu de la page Wave pour le paiement ${paymentId}`);
      console.log(`User-Agent: ${userAgent}`);
      console.log(`Type d'appareil: ${deviceType}`);

      // Stocker ou mettre à jour l'information dans les données de paiement
      paymentInfo.isMobile = deviceType === 'mobile';

      // Créer d'abord une page de chargement avec la détection de sécurité
      res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chargement du paiement</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #00bfff;
              color: white;
              margin: 0;
              padding: 0;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              width: 100vw;
              overflow-x: hidden;
            }
            .loader {
              border: 5px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top: 5px solid white;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            #content-container {
              width: 100%;
              height: 100%;
              display: none;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              overflow-y: auto;
              overflow-x: hidden;
            }
            .header {
              background-color: #007bff;
              padding: 10px;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div class="header">
            Paiement sécurisé Longrich - Le montant ne peut pas être modifié
          </div>
          
          <div id="loading">
            <div class="loader"></div>
            <p>Chargement sécurisé en cours...</p>
          </div>
          
          <div id="content-container"></div>
          
          <script>
            // Anti-inspection et anti-débogage - TEMPORAIREMENT DÉSACTIVÉ POUR DÉBOGAGE
            (function() {
              // Détection de DevTools - Variables globales
              window.devToolsOpen = false;
              
              // DÉBOGAGE: Fonction de détection désactivée
              const checkDevTools = () => {
                return false; // Toujours retourner false pour permettre l'ouverture des DevTools
              };
              
              // DÉBOGAGE: Pas de vérification immédiate
              
              // DÉBOGAGE: Ne pas désactiver le clic droit
              // document.addEventListener('contextmenu', e => e.preventDefault());
              
              // DÉBOGAGE: Ne pas désactiver la sélection de texte
              // document.addEventListener('selectstart', e => e.preventDefault());
              
              // DÉBOGAGE: Pas de vérification périodique
              // setInterval(checkDevTools, 500);
              
              // DÉBOGAGE: Ne pas désactiver les raccourcis clavier
              /*
              window.addEventListener('keydown', (e) => {
                if ((e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || e.keyCode === 123) {
                  e.preventDefault();
                  window.location.href = '/security-violation';
                }
              });
              */
              
              // DÉBOGAGE: Ne pas détecter la pause de l'exécution
              /*
              let lastTime = Date.now();
              setInterval(function() {
                const currentTime = Date.now();
                if (currentTime - lastTime > 1000) {
                  window.location.href = '/security-violation';
                }
                lastTime = currentTime;
              }, 100);
              */
              
              console.log("Mode débogage activé - DevTools autorisés temporairement");
            })();
            
            // Fonction pour charger le contenu de paiement après vérification de sécurité
            setTimeout(function() {
              if (!window.devToolsOpen) {
                fetch('/payment-content/${paymentId}')
                  .then(function(response) { return response.text(); })
                  .then(function(html) {
                    document.getElementById('loading').style.display = 'none';
                    var container = document.getElementById('content-container');
                    container.style.display = 'block';
                    container.innerHTML = html;
                    
                    // Appliquer des styles pour centrer le contenu
                    var style = document.createElement('style');
                    style.textContent = '#content { margin: 0 auto !important; max-width: 600px !important; }';
                    document.head.appendChild(style);
                  })
                  .catch(function(error) {
                    console.error('Erreur lors du chargement du contenu:', error);
                    window.location.href = '/payment-error';
                  });
              }
            }, 1500);
          </script>
        </body>
        </html>
      `);

    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu Wave:`, error);
      res.redirect('/payment-error');
    }
    return;
  }

  // Page HTML de confirmation qui utilise notre propre proxy
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de paiement Longrich</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #7952b3;
          margin-top: 0;
        }
        .amount {
          font-size: 28px;
          font-weight: bold;
          color: #28a745;
          margin: 20px 0;
          background-color: #f0fff0;
          padding: 15px;
          border-radius: 8px;
        }
        .btn {
          display: inline-block;
          background-color: #7952b3;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
        .btn:hover {
          background-color: #6741a2;
        }
        .details {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .secure-badge {
          display: inline-block;
          background-color: #28a745;
          color: white;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 10px;
          margin-left: 10px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Confirmation de paiement <span class="secure-badge">Sécurisé</span></h1>
        <p>Vous êtes sur le point d'effectuer un paiement sécurisé pour votre commande Longrich.</p>
        
        <div class="details">
          <p><strong>Description:</strong> ${paymentInfo.description}</p>
          <p><strong>Région:</strong> ${paymentInfo.region}</p>
        </div>
        
        <div class="amount">Montant: ${paymentInfo.amount.toLocaleString()} FCFA</div>
        
        <p>En cliquant sur le bouton ci-dessous, vous accéderez à notre interface de paiement sécurisée Wave.</p>
        
        <a href="/payment-proxy/${paymentId}?action=proceed" class="btn">Procéder au paiement</a>
      </div>
    </body>
    </html>
  `);
});

// Nouvel endpoint pour charger le contenu de paiement après vérification de sécurité
app.get('/payment-content/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  // Vérifier si le paiement existe
  if (!pendingPayments.has(paymentId)) {
    return res.status(404).json({ error: 'Paiement non trouvé' });
  }

  const paymentInfo = pendingPayments.get(paymentId);

  try {
    // Utiliser le User-Agent stocké dans les données de paiement si disponible
    const storedUserAgent = paymentInfo.userAgent;
    const isMobile = paymentInfo.isMobile;

    console.log(`[PAYMENT CONTENT] User-Agent original: ${req.headers['user-agent']}`);
    console.log(`[PAYMENT CONTENT] User-Agent stocké: ${storedUserAgent}`);
    console.log(`[PAYMENT CONTENT] Type d'appareil: ${isMobile ? 'Mobile' : 'Desktop'}`);

    // Utiliser le User-Agent stocké ou celui de la requête actuelle
    const userAgentToUse = storedUserAgent || req.headers['user-agent'] || 'Mozilla/5.0 (compatible; WavePaymentProxy/1.0)';

    const headers = {
      'Origin': `${req.protocol}://${req.get('host')}`,
      'Referer': `${req.protocol}://${req.get('host')}/payment-proxy/${paymentId}`,
      'User-Agent': userAgentToUse,
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    console.log(`[PAYMENT CONTENT] En-têtes de requête:`, headers);

    const response = await fetch(paymentInfo.originalUrl, { headers });
    let waveContent = await response.text();

    // Obtenir l'URL de base de Wave pour les ressources
    const waveUrlObj = new URL(paymentInfo.originalUrl);
    const waveBaseUrl = waveUrlObj.origin;

    // Modifier la Content-Security-Policy pour permettre les images externes et les scripts nécessaires
    const cspHeader = "default-src 'self' https://*.wave.com https://pay.wave.com https://play.google.com https://tools.applemediaservices.com https://api.qrserver.com https://apps.apple.com https://developer.apple.com https://*.cloudflareinsights.com; img-src * data:; script-src 'self' 'unsafe-inline' https://*.cloudflareinsights.com https://*.wave.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://*.wave.com; connect-src 'self' https://*.wave.com https://*.cloudflareinsights.com;";

    // Préserver les images en base64 et les liens externes
    // Ne pas modifier les attributs src qui contiennent déjà "data:image"
    waveContent = waveContent.replace(/src="data:image\/[^"]+"/g, match => match);

    // Définir les images SVG intégrées
    const inlineSvgs = {
      'payez-avec-wave-stacked.svg': `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyMDAgNjAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCI+UGF5ZXogYXZlYyBXYXZlPC90ZXh0Pjwvc3ZnPg==`,
      'camera-icon.svg': `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTEyIDE1LjJhMy4yIDMuMiAwIDEwMC02LjQgMy4yIDMuMiAwIDAwMCA2LjR6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik05IDJMNy4xNyA0SDRjLTEuMSAwLTIgLjktMiAydjEyYzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWNmMwLTEuMS0uOS0yLTItMmgtMy4xN0wxNSAySDl6bTMgMTVjLTIuNzYgMC01LTIuMjQtNS01czIuMjQtNSA1LTUgNSAyLjI0IDUgNS0yLjI0IDUtNSA1eiIvPjwvc3ZnPg==`,
      'wave-logo.svg': `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAxMjAgNjAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXdlaWdodD0iYm9sZCI+V0FWRTwvdGV4dD48L3N2Zz4=`
    };

    // Remplacer les URLs des ressources statiques par des images intégrées
    waveContent = waveContent.replace(new RegExp(`${waveBaseUrl}/static/([^"']+)["']`, 'g'), (match, filename) => {
      // Vérifier si nous avons une version intégrée de cette image
      for (const [svgName, svgData] of Object.entries(inlineSvgs)) {
        if (filename.includes(svgName)) {
          return `"${svgData}"`;
        }
      }
      // Si nous n'avons pas de version intégrée, utiliser une URL de proxy
      return `"/static/${filename}"`;
    });

    // Remplacer directement les balises <img> qui font référence aux images problématiques
    waveContent = waveContent.replace(/<img[^>]*src=["']\/static\/payez-avec-wave-stacked\.svg["'][^>]*>/g,
      `<img src="${inlineSvgs['payez-avec-wave-stacked.svg']}" alt="Payez avec Wave" style="height: 100px; margin: 0 auto; display: block;">`);

    waveContent = waveContent.replace(/<img[^>]*src=["']\/static\/camera-icon\.svg["'][^>]*>/g,
      `<img src="${inlineSvgs['camera-icon.svg']}" alt="Camera Icon" style="width: 24px; height: 24px;">`);

    waveContent = waveContent.replace(/<img[^>]*src=["']\/static\/wave-logo\.svg["'][^>]*>/g,
      `<img src="${inlineSvgs['wave-logo.svg']}" alt="Wave Logo" style="height: 60px;">`);

    // Remplacer également les références aux images dans les styles CSS
    waveContent = waveContent.replace(/url\(['"]?\/static\/([^'")\s]+)['"]?\)/g, (match, filename) => {
      for (const [svgName, svgData] of Object.entries(inlineSvgs)) {
        if (filename.includes(svgName)) {
          return `url('${svgData}')`;
        }
      }
      return match;
    });

    // Supprimer les attributs d'intégrité (integrity) des scripts qui causent des problèmes
    waveContent = waveContent.replace(/integrity="[^"]+"/g, '');
    waveContent = waveContent.replace(/crossorigin="[^"]+"/g, 'crossorigin="anonymous"');

    // Autoriser explicitement les scripts de Cloudflare
    waveContent = waveContent.replace(/<script/g, '<script crossorigin="anonymous"');

    // Ne pas modifier les liens externes vers Google Play et Apple Store
    waveContent = waveContent.replace(/href=['"]https:\/\/play\.google\.com\/[^'"]+['"]/g, match => match);
    waveContent = waveContent.replace(/href=['"]https:\/\/apps\.apple\.com\/[^'"]+['"]/g, match => match);
    waveContent = waveContent.replace(/src=['"]https:\/\/play\.google\.com\/[^'"]+['"]/g, match => match);
    waveContent = waveContent.replace(/src=['"]https:\/\/tools\.applemediaservices\.com\/[^'"]+['"]/g, match => match);
    waveContent = waveContent.replace(/src=['"]https:\/\/developer\.apple\.com\/[^'"]+['"]/g, match => match);

    // Remplacer les URLs relatives par des images intégrées ou des URLs locales
    waveContent = waveContent.replace(/src=["']\/([^"']+)["']/g, (match, p1) => {
      // Ne pas modifier si c'est déjà une URL complète ou une image en base64
      if (p1.startsWith('http') || p1.startsWith('data:')) {
        return match;
      }

      // Vérifier si c'est une image SVG que nous pouvons remplacer
      if (p1.startsWith('static/')) {
        const filename = p1.substring(7); // Enlever 'static/'
        for (const [svgName, svgData] of Object.entries(inlineSvgs)) {
          if (filename.includes(svgName)) {
            return `src="${svgData}"`;
          }
        }
      }

      return `src="/${p1}"`;
    });

    waveContent = waveContent.replace(/href=["']\/([^"']+)["']/g, (match, p1) => {
      // Ne pas modifier si c'est déjà une URL complète
      if (p1.startsWith('http')) {
        return match;
      }
      return `href="/${p1}"`;
    });

    // Corriger le style pour centrer correctement le contenu
    // Supprimer les marges qui pourraient causer un décalage
    const fixCenteringStyle = `
      <style>
        #content {
          margin-left: auto !important;
          margin-right: auto !important;
          width: 100% !important;
          max-width: 600px !important;
          text-align: center !important;
        }
        body {
          text-align: center !important;
          width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow-x: hidden !important;
        }
        html {
          overflow-x: hidden !important;
        }
        .scan, .qr-container, #qrcode {
          margin: 0 auto !important;
          display: block !important;
        }
        #badge-container {
          margin: 0 auto !important;
          justify-content: center !important;
        }
      </style>
    `;

    // Ajouter notre propre script pour surveiller le statut du paiement
    const trackingScript = `
      <script>
        // Script pour vérifier le statut du paiement
        const checkPaymentStatus = async () => {
          try {
            const response = await fetch('/api/payment-status/${paymentId}');
            const data = await response.json();
            
            if (data.status === 'completed') {
              // Rediriger vers la page de succès
              window.location.href = '/payment-success/${paymentId}';
            } else {
              // Vérifier à nouveau dans 5 secondes
              setTimeout(checkPaymentStatus, 5000);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            // Réessayer dans 10 secondes en cas d'erreur
            setTimeout(checkPaymentStatus, 10000);
          }
        };
        
        // Démarrer la vérification après 5 secondes
        setTimeout(checkPaymentStatus, 5000);
        
        // DÉBOGAGE: Anti-inspection désactivée temporairement
        (function() {
          console.log("Mode débogage activé - DevTools autorisés temporairement");
          
          // DÉBOGAGE: Fonction de détection désactivée
          const checkDevTools = () => {
            return false; // Toujours retourner false pour permettre l'ouverture des DevTools
          };
          
          // DÉBOGAGE: Pas de vérification périodique
          // setInterval(checkDevTools, 500);
          
          // DÉBOGAGE: Pas de détection de pause
          /*
          let lastTime = Date.now();
          setInterval(function() {
            const currentTime = Date.now();
            if (currentTime - lastTime > 1000) {
              window.location.href = '/security-violation';
            }
            lastTime = currentTime;
          }, 100);
          */
        })();
      </script>
    `;

    // Extraire uniquement le contenu principal de la page Wave
    // Nous ne voulons pas les balises html, head et body complètes car nous les injectons dans un conteneur
    let mainContent = waveContent;

    // Supprimer les scripts existants qui pourraient interférer
    mainContent = mainContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Ajouter notre style de correction de centrage
    mainContent = fixCenteringStyle + mainContent;

    // Ajouter notre script de suivi
    mainContent += trackingScript;

    // Définir les en-têtes pour empêcher la mise en cache et l'inspection
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', cspHeader);

    // Envoyer uniquement le contenu principal
    res.send(mainContent);

  } catch (error) {
    console.error(`Erreur lors de la récupération du contenu Wave:`, error);

    // En cas d'échec, afficher une page d'erreur générique sans exposer l'URL originale
    res.send(`
      <div style="text-align: center; padding: 20px; width: 100%; max-width: 600px; margin: 0 auto;">
        <h2>Erreur de connexion</h2>
        <p>Nous rencontrons actuellement des difficultés pour établir une connexion avec notre service de paiement.</p>
        <p>Veuillez réessayer dans quelques instants ou contacter notre service client.</p>
        
        <button onclick="window.location.reload()" style="background-color: #00bfff; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; cursor: pointer;">
          Réessayer
        </button>
        
        <button onclick="window.history.back()" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; margin-left: 10px; cursor: pointer;">
          Retour
        </button>
      </div>
    `);
  }
});

// Endpoint pour les erreurs de paiement
app.get('/payment-error', (req, res) => {
  res.status(500).send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Erreur de paiement</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #dc3545;
        }
        .icon {
          font-size: 64px;
          color: #dc3545;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          background-color: #7952b3;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Erreur lors du chargement du paiement</h1>
        <p>Une erreur est survenue lors du chargement de la page de paiement.</p>
        <p>Veuillez réessayer ou contacter le service client.</p>
        <a href="https://longrich-3212d.web.app" class="btn">Retour à la boutique</a>
      </div>
    </body>
    </html>
  `);
});

// Endpoint pour la page de succès du paiement
app.get('/payment-success/:paymentId', (req, res) => {
  const { paymentId } = req.params;

  // Vérifier si le paiement existe
  if (!pendingPayments.has(paymentId)) {
    return res.redirect('/');
  }

  const paymentInfo = pendingPayments.get(paymentId);

  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paiement réussi - Longrich</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #28a745;
        }
        .icon {
          font-size: 64px;
          color: #28a745;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          background-color: #7952b3;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
        .details {
          background-color: #f0fff0;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✓</div>
        <h1>Paiement réussi !</h1>
        <p>Votre paiement a été traité avec succès.</p>
        
        <div class="details">
          <p><strong>Montant:</strong> ${paymentInfo.amount.toLocaleString()} FCFA</p>
          <p><strong>Description:</strong> ${paymentInfo.description}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>ID de transaction:</strong> ${paymentId}</p>
        </div>
        
        <p>Merci pour votre commande. Vous recevrez bientôt une confirmation par email.</p>
        
        <a href="https://longrich-3212d.web.app" class="btn">Retour à la boutique</a>
      </div>
    </body>
    </html>
  `);

  // Supprimer le paiement de la liste des paiements en attente
  pendingPayments.delete(paymentId);
});

// Endpoint pour les violations de sécurité
app.get('/security-violation', (req, res) => {
  res.status(403).send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Violation de sécurité</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #dc3545;
        }
        .icon {
          font-size: 64px;
          color: #dc3545;
          margin-bottom: 20px;
        }
        .btn {
          display: inline-block;
          background-color: #7952b3;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚠️</div>
        <h1>Violation de sécurité détectée</h1>
        <p>Une tentative d'inspection ou de manipulation de la page de paiement a été détectée.</p>
        <p>Cette action a été enregistrée pour des raisons de sécurité.</p>
        <a href="https://longrich-3212d.web.app" class="btn">Retour à la boutique</a>
      </div>
    </body>
    </html>
  `);
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Erreur serveur:`, err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Charger les certificats SSL
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
};

// Créer les serveurs HTTP et HTTPS
const httpServer = http.createServer(app);
const httpsServer = https.createServer(sslOptions, app);

// Démarrer les serveurs
httpServer.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Serveur HTTP démarré sur le port ${PORT}`);
});

httpsServer.listen(PORT + 1, () => {
  console.log(`[${new Date().toISOString()}] Serveur HTTPS démarré sur le port ${PORT + 1}`);
  console.log(`[${new Date().toISOString()}] Accédez à votre serveur sécurisé via https://localhost:${PORT + 1}`);
});

// ========================================
// GESTION DE L'ARRÊT PROPRE DU SERVEUR
// ========================================
import paymentPollingService from './services/paymentPollingService.js';

function gracefulShutdown(signal) {
  console.log(`\n[${new Date().toISOString()}] Signal ${signal} reçu - Arrêt propre du serveur...`);
  
  // Arrêter tous les jobs de polling
  console.log('🔄 Arrêt des jobs de polling...');
  paymentPollingService.stopAllJobs();
  
  // Fermer toutes les connexions SSE
  console.log('🔄 Fermeture des connexions SSE...');
  sseService.closeAllConnections();
  
  // Fermer les serveurs
  console.log('🔄 Fermeture des serveurs...');
  httpServer.close(() => {
    console.log('✅ Serveur HTTP fermé');
  });
  
  httpsServer.close(() => {
    console.log('✅ Serveur HTTPS fermé');
    console.log('👋 Arrêt complet du serveur');
    process.exit(0);
  });
  
  // Force l'arrêt après 10 secondes
  setTimeout(() => {
    console.error('⚠️ Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
}

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // PM2 reload

console.log('✅ Gestionnaires d\'arrêt propre configurés'); 
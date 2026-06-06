import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST = path.join(PROJECT_ROOT, 'dist');
const SITE_URL = 'https://longrich.online';

// --- CONFIGURATION FIREBASE ADMIN ---
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const serviceAccountPath = path.join(PROJECT_ROOT, 'longrich-3212d-7b2897d075b7.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
}
const db = admin.firestore();

/**
 * Configuration des pages statiques de base
 */
const STATIC_PAGES = [
  {
    filename: 'index.html',
    urlPath: '/',
    title: 'Accueil',
    description: 'Boutique officielle Longrich. Produits de santé, beauté et bien-être de haute qualité au Sénégal.',
    keywords: 'Longrich, Produits de beauté, Santé naturelle, Sénégal',
    ogType: 'website'
  },
  {
    filename: 'contact.html',
    urlPath: '/contact',
    title: 'Contactez-nous',
    description: 'Notre équipe Longrich à Ziguinchor est à votre écoute. Contactez-nous par WhatsApp ou par email.',
    keywords: 'Longrich, Contact, Ziguinchor, Sénégal',
    ogType: 'website'
  },
  {
    filename: 'about.html',
    urlPath: '/about',
    title: 'À propos',
    description: "Découvrez l'histoire de Longrich, notre mission et nos valeurs.",
    keywords: 'Longrich, à propos, histoire, Sénégal',
    ogType: 'website'
  },
  {
    filename: 'privacy.html',
    urlPath: '/privacy',
    title: 'Politique de confidentialité',
    description: 'Politique de confidentialité de Longrich. Protection de vos données personnelles.',
    keywords: 'confidentialité, données personnelles, RGPD, Longrich',
    ogType: 'website',
    noIndex: true,
  }
];

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function buildHead(page) {
  const robots = page.noIndex ? 'noindex, nofollow' : 'index, follow';
  // Ajouter .jpg à la fin pour WhatsApp (correction du domaine ucarecd.net)
  let image = page.image || SITE_URL + '/logo-social.png';
  if (image.includes('ucarecd.net') && !image.endsWith('.jpg')) {
    image = image.endsWith('/') ? image + 'file.jpg' : image + '/file.jpg';
  }
  // Ajouter un paramètre de version pour éviter la troncature sur WhatsApp et forcer le cache
  const safeUrlPath = page.urlPath.endsWith('/') ? page.urlPath.slice(0, -1) : page.urlPath;
  const canonical = `${SITE_URL}${safeUrlPath}?v=1`;
  const title = page.title + ' | Longrich';

  console.log(`\ud83d\udce7 [DEBUG] Page: ${page.urlPath}`);
  console.log(`   \ud83d\uddbc\ufe0f Image SEO: ${image}`);

  const parts = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    page.keywords ? `<meta name="keywords" content="${escapeHtml(page.keywords)}" />` : '',
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="${page.ogType || 'website'}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`
  ];

  if (page.schema) {
    parts.push(`<script type="application/ld+json">${JSON.stringify(page.schema)}</script>`);
  }

  return parts.filter(Boolean).join('\n    ');
}

function injectMetaIntoSkeleton(skeleton, headContent) {
  // 1. Supprimer les balises existantes qui pourraient créer des doublons
  let cleanedSkeleton = skeleton
    .replace(/<title>.*?<\/title>/i, '')
    .replace(/<meta name="description".*?>/i, '')
    .replace(/<meta name="keywords".*?>/i, '')
    .replace(/<meta property="og:.*?".*?>/g, '')
    .replace(/<meta name="twitter:.*?".*?>/g, '');

  // 2. Injecter le nouveau contenu juste après la balise <head>
  return cleanedSkeleton.replace(/(<head[^>]*>)/i, '$1\n    ' + headContent);
}

/**
 * Met à jour le sitemap.xml
 */
function updateSitemap(allPages) {
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  const today = new Date().toISOString().split('T')[0];
  const urls = allPages.map(page => `
<url>
  <loc>${SITE_URL}${page.urlPath}</loc>
  <lastmod>${today}</lastmod>
  <changefreq>${page.urlPath === '/' ? 'daily' : 'weekly'}</changefreq>
  <priority>${page.urlPath === '/' ? '1.0' : '0.8'}</priority>
</url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
}

async function main() {
  console.log('\n🔍 Préréndering dynamique avec Firestore...\n');

  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html introuvable. Lancez: npm run build');
    process.exit(1);
  }
  const skeleton = fs.readFileSync(indexPath, 'utf8');

  // 1. RÉCUPÉRER LES PRODUITS DEPUIS FIRESTORE
  let products = [];
  try {
    const snapshot = await db.collection('products').get();
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ ${products.length} produits récupérés pour le SEO`);
  } catch (err) {
    console.error('⚠️ Impossible de récupérer les produits:', err.message);
  }

  // 2. CONSTRUIRE LA LISTE DES PAGES
  const allGeneratedPages = [...STATIC_PAGES];

  // Page boutique
  const shopImage = products.length > 0 ? products[0].image : null;
  allGeneratedPages.push({
    filename: 'products.html',
    urlPath: '/products',
    title: 'Nos Produits',
    description: 'Explorez notre gamme complète de produits Longrich pour la santé et la beauté.',
    image: shopImage,
    keywords: 'Longrich, produits, cosmétiques, santé',
    ogType: 'website'
  });

  // Pages de détail produits
  for (const product of products) {
    allGeneratedPages.push({
      filename: `product-detail-${product.id}.html`,
      urlPath: `/product/detail/${product.id}`,
      title: product.name,
      description: product.description.substring(0, 160) + '...',
      image: product.image,
      keywords: `Longrich, ${product.name}, ${product.category}`,
      ogType: 'product'
    });
  }

  // 3. GÉNÉRER LES FICHIERS
  for (const page of allGeneratedPages) {
    const headContent = buildHead(page);
    const html = injectMetaIntoSkeleton(skeleton, headContent);
    
    if (page.ogType === 'product') {
       // Créer un dossier au nom de l'ID du produit
       const productId = page.filename.split('-').pop().replace('.html', '');
       const productDir = path.join(DIST, 'product', 'detail', productId);
       
       if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });
       
       // Écrire l'index.html dans ce dossier
       fs.writeFileSync(path.join(productDir, 'index.html'), html, 'utf-8');
       console.log(`  ✅ Produit généré: /product/detail/${productId}/`);
    } else {
       fs.writeFileSync(path.join(DIST, page.filename), html, 'utf-8');
       console.log(`  ✅ Page générée: ${page.filename}`);
    }
  }

  updateSitemap(allGeneratedPages);
  console.log(`✅ Pré-rendu terminé : ${allGeneratedPages.length} pages générées avec succès !`);
  process.exit(0);
}

main();

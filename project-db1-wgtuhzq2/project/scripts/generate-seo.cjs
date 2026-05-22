const fs = require('fs');
const path = require('path');

// Configuration du domaine
const BASE_URL = 'https://longrich.online'; // URL de production
const DIST_DIR = path.join(__dirname, '../dist');

// Définition des routes avec leurs paramètres SEO
// Priority: 1.0 (haute) → 0.5 (basse)
// Changefreq: daily, weekly, monthly, yearly
const ROUTES = [
    // Pages principales (haute priorité)
    { path: '/', priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/products', priority: '0.9', changefreq: 'weekly', lastmod: new Date().toISOString().split('T')[0] },
    
    // Pages informatives (priorité moyenne)
    { path: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/about', priority: '0.6', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    
    // Pages légales (basse priorité, rarement modifiées)
    { path: '/privacy', priority: '0.5', changefreq: 'yearly', lastmod: new Date().toISOString().split('T')[0] },
    
    // REMARQUE: Les pages suivantes sont EXCLUES du sitemap car elles sont bloquées par robots.txt:
    // - /login (page technique, noindex)
    // - /register (page technique, noindex)  
    // - /profile (page utilisateur, noindex)
    // - /cart (page de processus, noindex)
    // - /dashboard-management-secure-x29a7b (admin, noindex)
    // - /product/detail/* (pages dynamiques, à ajouter manuellement ou via API)
];

// Générer le sitemap XML optimisé
function generateSitemap() {
    console.log('🌐 Génération du sitemap.xml optimisé...');

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(route => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    try {
        if (!fs.existsSync(DIST_DIR)) {
            fs.mkdirSync(DIST_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapContent);
        console.log(`✅ sitemap.xml généré avec ${ROUTES.length} URLs dans /dist`);
    } catch (err) {
        console.error('❌ Erreur lors de la génération du sitemap:', err);
    }
}

// Générer le robots.txt optimisé avec les directives de blocage
function generateRobotsTxt() {
    console.log('🤖 Génération du robots.txt optimisé...');

    const robotsTxt = `# Robots.txt pour Longrich
# Dernière mise à jour: ${new Date().toISOString().split('T')[0]}

# Bloquer les attaques de bots malveillants connu
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Tous les autres agents sont autorisés mais avec restrictions
User-agent: *

# Autoriser les pages publiques importantes
Allow: /$
Allow: /products$
Allow: /contact$
Allow: /about$
Allow: /privacy$

# Bloquer les pages techniques et d'authentification (pas utiles pour le SEO)
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /cart
Disallow: /checkout
Disallow: /product/detail/       # Bloquer les pages de détail produit individuelles (à débloquer quand elles seront SEO-friendly)
Disallow: /dashboard-management-secure-x29a7b
Disallow: /admin
Disallow: /api/                  # Bloquer les endpoints d'API
Disallow: /assets/               # Bloquer les fichiers statiques (forçage de sécurité)
Disallow: /*.js$                 # Bloquer les fichiers JS directement (ancienne méthode de crawle)
Disallow: /*.css$                # Bloquer les fichiers CSS directement

# Limiter la vitesse de crawl pour éviter la surcharge du serveur (optionnel mais recommandé)
# Crawl-delay: 10

# Sitemap pour Google et autres moteurs de recherche
Sitemap: ${BASE_URL}/sitemap.xml`;

    try {
        fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);
        console.log('✅ robots.txt généré avec succès dans /dist');
    } catch (err) {
        console.error('❌ Erreur lors de la génération du robots.txt:', err);
    }
}

// Exécution
generateSitemap();
generateRobotsTxt();
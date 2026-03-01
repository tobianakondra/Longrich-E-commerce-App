const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://longrich.online'; // URL de production
const DIST_DIR = path.join(__dirname, '../dist');
const ROUTES = [
    '/',
    '/products',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/privacy',
];

// Fonction pour générer le sitemap
function generateSitemap() {
    console.log('🌐 Génération du sitemap.xml...');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(route => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

    try {
        if (!fs.existsSync(DIST_DIR)) {
            fs.mkdirSync(DIST_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
        console.log('✅ sitemap.xml généré avec succès dans /dist');
    } catch (err) {
        console.error('❌ Erreur lors de la génération du sitemap:', err);
    }
}

// Fonction pour générer le robots.txt
function generateRobotsTxt() {
    console.log('🤖 Génération du robots.txt...');

    const robotsTxt = `User-agent: *
Allow: /

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

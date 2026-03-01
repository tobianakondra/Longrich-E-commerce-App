const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * GOOGLE INDEXING API SCRIPT
 * Forcer Google à indexer une URL spécifique très rapidement.
 */

const KEY_FILE = path.join(__dirname, '../longrich-3212d-7b2897d075b7.json');
const TARGET_URLS = [
    'https://longrich.online/',
    'https://longrich.online/products',
    'https://longrich.online/contact',
    'https://longrich.online/about',
];

async function notifyGoogle(urls) {
    if (!fs.existsSync(KEY_FILE)) {
        console.error('❌ Fichier JSON de clé de service introuvable !');
        console.log('💡 Assurez-vous que le fichier longrich-3212d-7b2897d075b7.json est bien à la racine.');
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const client = await auth.getClient();
        const indexing = google.indexing({ version: 'v3', auth: client });

        for (const url of urls) {
            console.log(`🚀 Notification pour : ${url}...`);
            const res = await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: 'URL_UPDATED',
                },
            });
            console.log('✅ Succès :', res.data.urlNotificationMetadata?.latestUpdate?.url || 'URL indexée');
        }

        console.log('\n🌟 Google a été notifié ! Vos pages seront traitées en priorité.');
    } catch (err) {
        console.error('❌ Erreur d\'API détaillée :');
        console.error('Message:', err.message);
        if (err.response && err.response.data) {
            console.error('Détails Google:', JSON.stringify(err.response.data, null, 2));
        }

        if (err.message.includes('403') || err.message.includes('Permission denied')) {
            console.log('\n💡 CONSEILS DE DÉPANNAGE :');
            console.log('1. Attendez 5 à 10 minutes (parfois la propagation est lente).');
            console.log('2. Assurez-vous que l\'URL https://longrich.online/ est BIEN la propriété exacte dans Search Console.');
            console.log('3. Dans Search Console, allez dans Paramètres > Utilisateurs > Cliquez sur les 3 points du compte SEO > Gérer les propriétaires.');
        }
    }
}

// Récupérer les URL passées en argument ou utiliser les défauts
const args = process.argv.slice(2);
const urlsToNotify = args.length > 0 ? args : TARGET_URLS;

notifyGoogle(urlsToNotify);

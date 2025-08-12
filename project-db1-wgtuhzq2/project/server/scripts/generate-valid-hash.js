/**
 * Script pour générer un hash valide pour tester l'IPN
 * Ce script calcule le hash SHA-512 de votre MASTER_KEY
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const masterKey = process.env.PAYDUNYA_MASTER_KEY;

if (!masterKey) {
  console.error('❌ PAYDUNYA_MASTER_KEY non configurée dans .env');
  console.log('💡 Ajoutez PAYDUNYA_MASTER_KEY=votre_cle_master dans votre fichier .env');
  process.exit(1);
}

// Calculer le hash SHA-512
const validHash = crypto.createHash('sha512').update(masterKey).digest('hex');

console.log('🔑 Master Key (masquée):', masterKey.substring(0, 10) + '...');
console.log('✅ Hash valide généré:', validHash);
console.log('');

// Créer des données de test avec le hash valide
const testData = {
  data: {
    response_code: "00",
    response_text: "Transaction Found",
    hash: validHash,
    invoice: {
      token: `test_valid_${Date.now()}`,
      total_amount: "30000",
      description: "Test IPN avec hash valide - Commande Longrich",
      items: {
        item_0: {
          name: "Produit Longrich Test Valide",
          quantity: "3",
          unit_price: "10000",
          total_price: "30000",
          description: "Test avec hash valide calculé"
        }
      }
    },
    status: "completed",
    customer: {
      name: "Client Test Hash Valide",
      phone: "774563209",
      email: "test-valide@longrich.com"
    },
    receipt_url: "https://paydunya.com/test-receipt-valid.pdf",
    custom_data: {
      test_type: "valid_hash_test",
      generated_at: new Date().toISOString()
    }
  }
};

console.log('📤 Commande curl pour tester avec hash valide:');
console.log('');
console.log(`curl -X POST https://api.longrich.online/api/ipn/paydunya-ipn \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: PayDunya-IPN-Test/1.0" \\
  -d '${JSON.stringify(testData, null, 2)}'`);

console.log('');
console.log('✅ Résultat attendu: HTTP 200 avec {"status":"success","message":"IPN traité avec succès"}');
console.log('📝 Vérifiez les logs du serveur pour voir le traitement complet');
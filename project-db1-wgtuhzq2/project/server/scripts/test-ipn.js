/**
 * Script de test pour l'IPN PayDunya
 * 
 * Ce script permet de tester l'endpoint IPN en simulant une notification PayDunya
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const SERVER_URL = process.env.IPN_BASE_URL || 'http://localhost:4000';
const MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY || 'test_master_key';

/**
 * Génère un hash SHA-512 pour simuler la signature PayDunya
 */
function generateTestHash(masterKey) {
  return crypto.createHash('sha512').update(masterKey).digest('hex');
}

/**
 * Crée des données de test pour simuler une notification IPN
 */
function createTestIPNData(status = 'completed') {
  const hash = generateTestHash(MASTER_KEY);
  
  return {
    data: {
      response_code: '00',
      response_text: 'Transaction Found',
      hash: hash,
      invoice: {
        token: `test_${Date.now()}`,
        total_amount: '25000',
        description: 'Test de paiement Longrich',
        items: {
          item_0: {
            name: 'Produit Test Longrich',
            quantity: '1',
            unit_price: '25000',
            total_price: '25000',
            description: 'Produit de test pour vérifier l\'IPN'
          }
        }
      },
      status: status,
      customer: {
        name: 'Client Test',
        phone: '774563209',
        email: 'test@longrich.com'
      },
      receipt_url: 'https://paydunya.com/sandbox-checkout/receipt/pdf/test_receipt.pdf',
      custom_data: {
        test: true,
        environment: 'test'
      }
    }
  };
}

/**
 * Teste l'endpoint de vérification IPN
 */
async function testIPNEndpoint() {
  try {
    console.log('🧪 Test de l\'endpoint IPN...');
    
    const response = await fetch(`${SERVER_URL}/api/ipn/test-ipn`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Endpoint IPN accessible');
      console.log('📊 Réponse:', data);
    } else {
      console.error('❌ Erreur d\'accès à l\'endpoint IPN');
      console.error('📊 Réponse:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'endpoint IPN:', error.message);
    return false;
  }
}

/**
 * Teste l'IPN avec un paiement réussi
 */
async function testSuccessfulPayment() {
  try {
    console.log('\n💰 Test de paiement réussi...');
    
    const testData = createTestIPNData('completed');
    
    const response = await fetch(`${SERVER_URL}/api/ipn/paydunya-ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Paiement réussi traité correctement');
      console.log('📊 Réponse:', data);
    } else {
      console.error('❌ Erreur lors du traitement du paiement réussi');
      console.error('📊 Réponse:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erreur lors du test de paiement réussi:', error.message);
    return false;
  }
}

/**
 * Teste l'IPN avec un paiement annulé
 */
async function testCancelledPayment() {
  try {
    console.log('\n🚫 Test de paiement annulé...');
    
    const testData = createTestIPNData('cancelled');
    
    const response = await fetch(`${SERVER_URL}/api/ipn/paydunya-ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Paiement annulé traité correctement');
      console.log('📊 Réponse:', data);
    } else {
      console.error('❌ Erreur lors du traitement du paiement annulé');
      console.error('📊 Réponse:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erreur lors du test de paiement annulé:', error.message);
    return false;
  }
}

/**
 * Teste l'IPN avec un paiement échoué
 */
async function testFailedPayment() {
  try {
    console.log('\n❌ Test de paiement échoué...');
    
    const testData = createTestIPNData('failed');
    
    const response = await fetch(`${SERVER_URL}/api/ipn/paydunya-ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Paiement échoué traité correctement');
      console.log('📊 Réponse:', data);
    } else {
      console.error('❌ Erreur lors du traitement du paiement échoué');
      console.error('📊 Réponse:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Erreur lors du test de paiement échoué:', error.message);
    return false;
  }
}

/**
 * Teste l'IPN avec un hash invalide (test de sécurité)
 */
async function testInvalidHash() {
  try {
    console.log('\n🔒 Test de sécurité (hash invalide)...');
    
    const testData = createTestIPNData('completed');
    testData.data.hash = 'invalid_hash_for_security_test';
    
    const response = await fetch(`${SERVER_URL}/api/ipn/paydunya-ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (response.status === 403) {
      console.log('✅ Sécurité OK - Hash invalide correctement rejeté');
      console.log('📊 Réponse:', data);
      return true;
    } else {
      console.error('❌ Problème de sécurité - Hash invalide accepté');
      console.error('📊 Réponse:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors du test de sécurité:', error.message);
    return false;
  }
}

/**
 * Fonction principale pour exécuter tous les tests
 */
async function runAllTests() {
  console.log('🚀 Démarrage des tests IPN PayDunya');
  console.log('🌐 URL du serveur:', SERVER_URL);
  console.log('🔑 Master Key:', MASTER_KEY ? 'Configurée' : 'Non configurée');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // Test 1: Vérification de l'endpoint
  results.push(await testIPNEndpoint());
  
  // Test 2: Paiement réussi
  results.push(await testSuccessfulPayment());
  
  // Test 3: Paiement annulé
  results.push(await testCancelledPayment());
  
  // Test 4: Paiement échoué
  results.push(await testFailedPayment());
  
  // Test 5: Sécurité (hash invalide)
  results.push(await testInvalidHash());
  
  // Résumé des résultats
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(50));
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('✅ L\'IPN PayDunya est correctement configuré et fonctionnel.');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
    console.log('🔧 Vérifiez la configuration et les logs du serveur.');
  }
  
  return passedTests === totalTests;
}

// Exécuter les tests si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale lors des tests:', error);
      process.exit(1);
    });
}

export { runAllTests, testIPNEndpoint, testSuccessfulPayment, testCancelledPayment, testFailedPayment, testInvalidHash };
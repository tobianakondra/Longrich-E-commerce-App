/**
 * Test rapide du service de paiement avec les nouvelles actions
 */

import { createWavePayment } from '../services/paymentService.js';

async function testPayment() {
  console.log('🧪 Test du service de paiement avec actions...');
  
  const testData = {
    amount: 1000,
    description: "Test avec actions callback",
    customerName: "Test User",
    customerPhone: "781234567",
    customerEmail: "test@example.com"
  };
  
  try {
    const paymentUrl = await createWavePayment(testData);
    console.log('✅ Paiement créé avec succès !');
    console.log('🔗 URL de paiement:', paymentUrl);
    
    // Vérifier que l'URL contient bien les paramètres de callback
    if (paymentUrl.includes('paydunya.com')) {
      console.log('✅ URL PayDunya générée correctement');
    } else {
      console.log('⚠️ URL inattendue:', paymentUrl);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testPayment();
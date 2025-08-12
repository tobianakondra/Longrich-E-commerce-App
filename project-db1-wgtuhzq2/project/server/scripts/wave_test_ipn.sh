#!/bin/bash

# Script de test pour l'IPN PayDunya/Wave
# Ce script teste les différents endpoints IPN

echo "🚀 Test de l'IPN PayDunya/Wave"
echo "================================"

# Configuration
SERVER_URL=${IPN_BASE_URL:-"http://localhost:4000"}
echo "🌐 URL du serveur: $SERVER_URL"

# Test 1: Vérifier que l'endpoint IPN est accessible
echo ""
echo "🧪 Test 1: Vérification de l'endpoint IPN..."
response=$(curl -s -w "%{http_code}" -o /tmp/ipn_test_response.json "$SERVER_URL/api/ipn/test-ipn")
http_code=${response: -3}

if [ "$http_code" = "200" ]; then
    echo "✅ Endpoint IPN accessible (HTTP $http_code)"
    echo "📊 Réponse:"
    cat /tmp/ipn_test_response.json | jq '.' 2>/dev/null || cat /tmp/ipn_test_response.json
else
    echo "❌ Erreur d'accès à l'endpoint IPN (HTTP $http_code)"
    cat /tmp/ipn_test_response.json
fi

# Test 2: Test avec Node.js (si disponible)
echo ""
echo "🧪 Test 2: Exécution des tests Node.js..."
if command -v node &> /dev/null; then
    if [ -f "test-ipn.js" ]; then
        node test-ipn.js
    else
        echo "⚠️  Fichier test-ipn.js non trouvé"
    fi
else
    echo "⚠️  Node.js non disponible pour les tests avancés"
fi

# Test 3: Test manuel avec curl (paiement réussi)
echo ""
echo "🧪 Test 3: Test manuel d'un paiement réussi..."

# Générer un hash de test (simplifié)
MASTER_KEY=${PAYDUNYA_MASTER_KEY:-"test_master_key"}
TEST_HASH=$(echo -n "$MASTER_KEY" | sha512sum | cut -d' ' -f1)

# Données de test pour un paiement réussi
TEST_DATA='{
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "hash": "'$TEST_HASH'",
    "invoice": {
      "token": "test_'$(date +%s)'",
      "total_amount": "15000",
      "description": "Test paiement Longrich via script",
      "items": {
        "item_0": {
          "name": "Produit Test",
          "quantity": "1",
          "unit_price": "15000",
          "total_price": "15000",
          "description": "Test via script bash"
        }
      }
    },
    "status": "completed",
    "customer": {
      "name": "Client Test Script",
      "phone": "774563209",
      "email": "test-script@longrich.com"
    },
    "receipt_url": "https://paydunya.com/test-receipt.pdf"
  }
}'

response=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -o /tmp/ipn_payment_response.json \
  "$SERVER_URL/api/ipn/paydunya-ipn")

http_code=${response: -3}

if [ "$http_code" = "200" ]; then
    echo "✅ Test de paiement réussi (HTTP $http_code)"
    echo "📊 Réponse:"
    cat /tmp/ipn_payment_response.json | jq '.' 2>/dev/null || cat /tmp/ipn_payment_response.json
else
    echo "❌ Erreur lors du test de paiement (HTTP $http_code)"
    cat /tmp/ipn_payment_response.json
fi

# Test 4: Test de sécurité (hash invalide)
echo ""
echo "🧪 Test 4: Test de sécurité (hash invalide)..."

# Données avec hash invalide
INVALID_TEST_DATA='{
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "hash": "invalid_hash_for_security_test",
    "invoice": {
      "token": "test_security_'$(date +%s)'",
      "total_amount": "10000",
      "description": "Test sécurité"
    },
    "status": "completed",
    "customer": {
      "name": "Test Sécurité",
      "phone": "774563209",
      "email": "security-test@longrich.com"
    }
  }
}'

response=$(curl -s -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$INVALID_TEST_DATA" \
  -o /tmp/ipn_security_response.json \
  "$SERVER_URL/api/ipn/paydunya-ipn")

http_code=${response: -3}

if [ "$http_code" = "403" ]; then
    echo "✅ Sécurité OK - Hash invalide correctement rejeté (HTTP $http_code)"
    echo "📊 Réponse:"
    cat /tmp/ipn_security_response.json | jq '.' 2>/dev/null || cat /tmp/ipn_security_response.json
else
    echo "❌ Problème de sécurité - Hash invalide accepté (HTTP $http_code)"
    cat /tmp/ipn_security_response.json
fi

# Nettoyage
rm -f /tmp/ipn_*.json

echo ""
echo "🏁 Tests terminés"
echo "📝 Vérifiez les logs du serveur pour plus de détails"
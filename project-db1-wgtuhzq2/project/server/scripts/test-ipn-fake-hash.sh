#!/bin/bash

# Script de test IPN avec un faux hash pour tester la sécurité
# Ce script envoie des données réalistes mais avec un hash invalide

echo "🔒 Test de sécurité IPN - Faux hash"
echo "=================================="

SERVER_URL="https://api.longrich.online"
ENDPOINT="/api/ipn/paydunya-ipn"

echo "🌐 URL de test: $SERVER_URL$ENDPOINT"
echo ""

# Données de test avec un FAUX HASH (pour tester la sécurité)
FAKE_HASH="faux_hash_pour_test_de_securite_123456789abcdef"

# Données réalistes de PayDunya mais avec faux hash
TEST_DATA='{
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "hash": "'$FAKE_HASH'",
    "invoice": {
      "token": "test_'$(date +%s)'",
      "total_amount": "25000",
      "description": "Test sécurité - Commande Longrich",
      "items": {
        "item_0": {
          "name": "Produit Longrich Test",
          "quantity": "2",
          "unit_price": "12500",
          "total_price": "25000",
          "description": "Test de sécurité avec faux hash"
        }
      }
    },
    "status": "completed",
    "customer": {
      "name": "Client Test Sécurité",
      "phone": "774563209",
      "email": "test-securite@longrich.com"
    },
    "receipt_url": "https://paydunya.com/sandbox-checkout/receipt/pdf/test_security.pdf",
    "custom_data": {
      "test_type": "security_test",
      "fake_hash": true
    },
    "actions": {
      "cancel_url": "https://longrich.online/cancel",
      "callback_url": "https://longrich.online/callback",
      "return_url": "https://longrich.online/success"
    },
    "mode": "test"
  }
}'

echo "📤 Envoi de la requête avec faux hash..."
echo "🔑 Hash utilisé (invalide): $FAKE_HASH"
echo ""

# Envoyer la requête POST avec curl
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "User-Agent: PayDunya-IPN-Test/1.0" \
  -d "$TEST_DATA" \
  "$SERVER_URL$ENDPOINT")

# Séparer le corps de la réponse et le code HTTP
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "📥 Réponse reçue:"
echo "🔢 Code HTTP: $http_code"
echo "📄 Corps de la réponse:"

# Essayer de formater le JSON si possible
if command -v jq &> /dev/null; then
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
else
    echo "$response_body"
fi

echo ""
echo "🔍 Analyse du résultat:"

if [ "$http_code" = "403" ]; then
    echo "✅ SÉCURITÉ OK - Le faux hash a été correctement rejeté (HTTP 403)"
    echo "🛡️  Le système de sécurité fonctionne comme prévu"
elif [ "$http_code" = "200" ]; then
    echo "❌ PROBLÈME DE SÉCURITÉ - Le faux hash a été accepté (HTTP 200)"
    echo "⚠️  ATTENTION: Le système de vérification de hash ne fonctionne pas !"
else
    echo "⚠️  Réponse inattendue (HTTP $http_code)"
    echo "🔧 Vérifiez les logs du serveur pour plus de détails"
fi

echo ""
echo "💡 Conseil: Vérifiez les logs du serveur pour voir les détails du traitement"
echo "📝 Commande pour voir les logs: tail -f logs/server.log | grep IPN"
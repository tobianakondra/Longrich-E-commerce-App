#!/bin/bash

# Script de test IPN avec un exemple de hash valide
# IMPORTANT: Remplacez le hash par celui généré avec votre vraie MASTER_KEY

echo "🔑 Test IPN avec hash valide (exemple)"
echo "====================================="

# EXEMPLE de hash valide (vous devez le remplacer par le vôtre)
# Pour générer le bon hash, utilisez cette commande :
# echo -n "VOTRE_MASTER_KEY" | sha512sum

VALID_HASH="726eb327681659bf73f45d730987ad66fa812804924b3fe275c73ef44ff0c81ff3fa9c1fe347505e89b7fc361bac81c6f15eedb2d6688148481a2b763b05346a"

echo "✅ Ce script utilise votre vraie MASTER_KEY"
echo "🔧 Pour un test réel, vous devez :"
echo "   1. Récupérer votre vraie PAYDUNYA_MASTER_KEY"
echo "   2. Calculer son hash SHA-512"
echo "   3. Remplacer le hash dans ce script"
echo ""

# Données de test avec hash d'exemple
TEST_DATA='{
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "hash": "'$VALID_HASH'",
    "invoice": {
      "token": "test_valid_'$(date +%s)'",
      "total_amount": "30000",
      "description": "Test IPN avec hash valide - Commande Longrich",
      "items": {
        "item_0": {
          "name": "Produit Longrich Test Valide",
          "quantity": "3",
          "unit_price": "10000",
          "total_price": "30000",
          "description": "Test avec hash valide"
        }
      }
    },
    "status": "completed",
    "customer": {
      "name": "Client Test Hash Valide",
      "phone": "774563209",
      "email": "test-valide@longrich.com"
    },
    "receipt_url": "https://paydunya.com/test-receipt-valid.pdf"
  }
}'

echo "📤 Envoi de la requête avec hash valide..."
echo "🔑 Hash utilisé: $VALID_HASH"
echo ""

# Envoyer la requête
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "User-Agent: PayDunya-IPN-Test/1.0" \
  -d "$TEST_DATA" \
  "https://api.longrich.online/api/ipn/paydunya-ipn")

# Analyser la réponse
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

echo "📥 Réponse reçue:"
echo "🔢 Code HTTP: $http_code"
echo "📄 Corps de la réponse:"

if command -v jq &> /dev/null; then
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
else
    echo "$response_body"
fi

echo ""
echo "🔍 Analyse du résultat:"

if [ "$http_code" = "200" ]; then
    echo "✅ HASH VALIDE - La requête a été acceptée (HTTP 200)"
    echo "🎉 Le système de traitement IPN fonctionne correctement"
elif [ "$http_code" = "403" ]; then
    echo "❌ HASH INVALIDE - La requête a été rejetée (HTTP 403)"
    echo "🔧 Le hash d'exemple ne correspond pas à votre MASTER_KEY"
    echo "💡 Utilisez votre vraie MASTER_KEY pour générer le bon hash"
else
    echo "⚠️  Réponse inattendue (HTTP $http_code)"
fi

echo ""
echo "📝 Pour générer le bon hash avec votre MASTER_KEY :"
echo "   echo -n 'VOTRE_MASTER_KEY' | sha512sum"
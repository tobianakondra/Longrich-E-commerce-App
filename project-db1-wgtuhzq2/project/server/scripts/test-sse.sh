#!/bin/bash

# Script de test pour le service SSE (Server-Sent Events)

echo "🔄 Test du service SSE (Server-Sent Events)"
echo "==========================================="

SERVER_URL="https://api.longrich.online"
TEST_USER_ID="test_user_123"

echo "🌐 URL du serveur: $SERVER_URL"
echo "👤 ID utilisateur de test: $TEST_USER_ID"
echo ""

# Test 1: Vérifier les statistiques SSE
echo "📊 Test 1: Vérification des statistiques SSE..."
response=$(curl -s "$SERVER_URL/api/sse/stats")
echo "Réponse: $response"
echo ""

# Test 2: Envoyer un événement de test
echo "🧪 Test 2: Envoi d'un événement de test..."
response=$(curl -s -X POST "$SERVER_URL/api/sse/test/$TEST_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test", "message": "Test depuis script bash"}')
echo "Réponse: $response"
echo ""

# Test 3: Simuler une mise à jour de commande
echo "📦 Test 3: Simulation d'une mise à jour de commande..."
response=$(curl -s -X POST "$SERVER_URL/api/sse/simulate-order/$TEST_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "CMD-TEST-001",
    "status": "completed",
    "amount": 25000,
    "products": ["Produit Test SSE"]
  }')
echo "Réponse: $response"
echo ""

# Test 4: Simuler une notification de paiement
echo "💳 Test 4: Simulation d'une notification de paiement..."
response=$(curl -s -X POST "$SERVER_URL/api/sse/simulate-payment/$TEST_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAY-TEST-001",
    "status": "completed",
    "amount": 30000,
    "method": "wave"
  }')
echo "Réponse: $response"
echo ""

# Test 5: Diffusion à tous les utilisateurs
echo "📢 Test 5: Diffusion d'un message à tous les utilisateurs..."
response=$(curl -s -X POST "$SERVER_URL/api/sse/broadcast" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "announcement",
    "message": "Message de test diffusé à tous",
    "data": {"priority": "normal"}
  }')
echo "Réponse: $response"
echo ""

echo "✅ Tests SSE terminés"
echo "💡 Pour tester une connexion SSE en temps réel, utilisez:"
echo "   curl -N $SERVER_URL/api/sse/connect/$TEST_USER_ID"
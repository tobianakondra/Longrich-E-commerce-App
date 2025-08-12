#!/bin/bash

# Étape 1: Créer l'invoice et obtenir le token
RESPONSE=$(curl -s -H "Content-Type: application/json" \
-H "PAYDUNYA-MASTER-KEY: fBU7rawR-4OhA-aDBN-jncR-KBa8NAQ6on1f" \
-H "PAYDUNYA-PRIVATE-KEY: live_private_By9gMQcM5z9RXrgJVO3x4tli4xB" \
-H "PAYDUNYA-TOKEN: EKSjYaohQTRmM5seHPkv" \
-X POST -d '{
  "invoice": {
    "total_amount": 5000, 
    "description": "Test de paiement",
    "currency": "XOF"
  },
  "store": {"name": "Longrich"}
}' \
"https://app.paydunya.com/api/v1/checkout-invoice/create")

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token obtenu: $TOKEN"

# Étape 2: Utiliser le token pour générer un QR code Wave
curl -H "Content-Type: application/json" \
-H "PAYDUNYA-MASTER-KEY: fBU7rawR-4OhA-aDBN-jncR-KBa8NAQ6on1f" \
-H "PAYDUNYA-PRIVATE-KEY: live_private_By9gMQcM5z9RXrgJVO3x4tli4xB" \
-H "PAYDUNYA-TOKEN: EKSjYaohQTRmM5seHPkv" \
-X POST -d "{
  
    \"wave_senegal_fullName\": \"John Doe\",
    \"wave_senegal_email\": \"test@example.com\",
    \"wave_senegal_phone\": \"771234567\",
    \"wave_senegal_payment_token\": \"$TOKEN\"
    
  
}" \
"https://app.paydunya.com/api/v1/softpay/wave-senegal"

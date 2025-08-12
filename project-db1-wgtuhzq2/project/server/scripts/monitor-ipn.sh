#!/bin/bash

# Script de monitoring des logs IPN en temps réel
# Ce script affiche uniquement les logs liés à l'IPN avec une mise en forme colorée

echo "🔍 Monitoring des logs IPN PayDunya/Wave"
echo "========================================"
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

# Fonction pour afficher les logs avec couleurs
monitor_ipn_logs() {
    if command -v pm2 &> /dev/null; then
        echo "📊 Monitoring via PM2..."
        pm2 logs --lines 0 | grep --line-buffered "\[IPN\]" | while read line; do
            echo -e "\033[32m$(date '+%H:%M:%S')\033[0m $line"
        done
    elif [ -f "logs/server.log" ]; then
        echo "📊 Monitoring via fichier de logs..."
        tail -f logs/server.log | grep --line-buffered "\[IPN\]" | while read line; do
            echo -e "\033[32m$(date '+%H:%M:%S')\033[0m $line"
        done
    else
        echo "❌ Aucun système de logs détecté"
        echo "💡 Démarrez votre serveur avec 'node server.js' pour voir les logs en direct"
    fi
}

# Démarrer le monitoring
monitor_ipn_logs
#!/bin/bash

# ============================================
# AVTOJON DEPLOY SCRIPT
# ============================================

set -e

APP_DIR="/var/www/avtojon"
DOMAIN="avtojon.uz"

echo "🚀 Avtojon deploy boshlandi..."

cd $APP_DIR

# 1. Git pull
echo "📥 Yangilanishlar yuklanmoqda..."
git pull origin main

# 2. Backend dependencies
echo "📦 Backend dependencies o'rnatilmoqda..."
cd $APP_DIR/apps/api
npm install --production

# 3. Frontend build
echo "🔨 Frontend build qilinmoqda..."
cd $APP_DIR/apps/web
npm install
VITE_API_URL=/api npm run build

# 4. PM2 restart
echo "🔄 API qayta ishga tushirilmoqda..."
cd $APP_DIR
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# 5. Nginx reload
echo "🌐 Nginx qayta yuklanmoqda..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deploy muvaffaqiyatli tugadi!"
echo "🌍 Sayt: https://$DOMAIN"

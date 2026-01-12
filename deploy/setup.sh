#!/bin/bash

# ============================================
# AVTOJON VPS SETUP SCRIPT
# Ubuntu 22.04+ uchun
# ============================================

set -e

echo "🚀 Avtojon VPS Setup boshlandi..."

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# O'zgaruvchilar
DOMAIN="avtojon.uz"
APP_DIR="/var/www/avtojon"
LOG_DIR="/var/log/avtojon"

# 1. Tizimni yangilash
echo -e "${YELLOW}📦 Tizim yangilanmoqda...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Kerakli paketlarni o'rnatish
echo -e "${YELLOW}📦 Kerakli paketlar o'rnatilmoqda...${NC}"
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# 3. Node.js 20 LTS o'rnatish
echo -e "${YELLOW}📦 Node.js 20 o'rnatilmoqda...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. PM2 o'rnatish
echo -e "${YELLOW}📦 PM2 o'rnatilmoqda...${NC}"
sudo npm install -g pm2

# 5. MongoDB o'rnatish
echo -e "${YELLOW}📦 MongoDB o'rnatilmoqda...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 6. Redis o'rnatish (ixtiyoriy - rate limiting uchun)
echo -e "${YELLOW}📦 Redis o'rnatilmoqda...${NC}"
sudo apt install -y redis-server
sudo systemctl enable redis-server

# 7. Papkalar yaratish
echo -e "${YELLOW}📁 Papkalar yaratilmoqda...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo chown -R $USER:$USER $APP_DIR
sudo chown -R $USER:$USER $LOG_DIR

# 8. Firewall sozlash
echo -e "${YELLOW}🔥 Firewall sozlanmoqda...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 9. Nginx konfiguratsiya
echo -e "${YELLOW}🌐 Nginx sozlanmoqda...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}✅ Setup tugadi!${NC}"
echo ""
echo -e "${YELLOW}Keyingi qadamlar:${NC}"
echo "1. GitHub dan loyihani clone qiling:"
echo "   cd $APP_DIR && git clone https://github.com/YOUR_USERNAME/avtojon.git ."
echo ""
echo "2. .env faylini yarating:"
echo "   cp .env.example apps/api/.env"
echo "   nano apps/api/.env"
echo ""
echo "3. Deploy skriptini ishga tushiring:"
echo "   bash deploy/deploy.sh"

#!/bin/bash

# ============================================
# VPS DA YANGI REPOSITORY NI ULASH
# ============================================

set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# O'zgaruvchilar
NEW_REPO="https://github.com/mironshoxraxmatilloyev-dotcom/Avtojon.uz.git"
APP_DIR="/var/www/avtojon"
BACKUP_DIR="/var/backups/avtojon"

echo -e "${BLUE}🔄 Repository o'zgartirish boshlandi...${NC}"

# 1. Backup yaratish
echo -e "${YELLOW}💾 Backup yaratilmoqda...${NC}"
sudo mkdir -p $BACKUP_DIR
sudo cp -r $APP_DIR $BACKUP_DIR/backup-before-repo-change-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "Backup yaratishda xatolik (normal)"

# 2. Hozirgi repository ni tekshirish
cd $APP_DIR
echo -e "${YELLOW}📋 Hozirgi repository:${NC}"
git remote -v

# 3. PM2 jarayonlarini to'xtatish
echo -e "${YELLOW}⏹️  PM2 jarayonlari to'xtatilmoqda...${NC}"
pm2 stop all || echo "PM2 jarayonlari topilmadi"

# 4. Yangi repository ni ulash
echo -e "${YELLOW}🔗 Yangi repository ulanmoqda...${NC}"
git remote set-url origin $NEW_REPO

# 5. Yangi repository dan ma'lumotlarni olish
echo -e "${YELLOW}📥 Yangi repository dan ma'lumotlar yuklanmoqda...${NC}"
git fetch origin

# 6. Main branch ga o'tish va yangilash
echo -e "${YELLOW}🔄 Main branch ga o'tish...${NC}"
git checkout main || git checkout -b main origin/main
git reset --hard origin/main

# 7. Repository holatini tekshirish
echo -e "${YELLOW}✅ Yangi repository holati:${NC}"
git remote -v
git status
git log --oneline -3

# 8. Dependencies o'rnatish
echo -e "${YELLOW}📦 Dependencies o'rnatilmoqda...${NC}"

# API dependencies
cd $APP_DIR/apps/api
rm -rf node_modules package-lock.json
npm install --production

# Web dependencies  
cd $APP_DIR/apps/web
rm -rf node_modules package-lock.json dist
npm install

# 9. Environment faylini tekshirish
echo -e "${YELLOW}🔧 Environment fayli tekshirilmoqda...${NC}"
if [ ! -f "$APP_DIR/apps/api/.env" ]; then
    echo -e "${RED}❌ API .env fayli topilmadi!${NC}"
    echo "Iltimos, .env faylini yarating:"
    echo "cp $APP_DIR/apps/api/.env.example $APP_DIR/apps/api/.env"
    echo "nano $APP_DIR/apps/api/.env"
    exit 1
fi

# 10. Frontend build
echo -e "${YELLOW}🔨 Frontend build qilinmoqda...${NC}"
cd $APP_DIR/apps/web
VITE_API_URL=/api npm run build

# 11. PM2 ni qayta ishga tushirish
echo -e "${YELLOW}🚀 PM2 qayta ishga tushirilmoqda...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# 12. PM2 holatini tekshirish
echo -e "${YELLOW}📊 PM2 holati:${NC}"
pm2 status
pm2 logs avtojon-api --lines 10

# 13. Nginx qayta yuklash
echo -e "${YELLOW}🌐 Nginx qayta yuklanmoqda...${NC}"
sudo nginx -t
sudo systemctl reload nginx

# 14. Deployment holatini tekshirish
echo -e "${YELLOW}🔍 Deployment tekshirilmoqda...${NC}"
sleep 5

# API health check
if curl -f -s "https://avtojon.uz/api/health" > /dev/null; then
    echo -e "${GREEN}✅ API ishlayapti!${NC}"
else
    echo -e "${RED}❌ API ishlamayapti!${NC}"
    echo "Loglarni tekshiring: pm2 logs avtojon-api"
fi

# Frontend check
if curl -f -s "https://avtojon.uz" > /dev/null; then
    echo -e "${GREEN}✅ Frontend ishlayapti!${NC}"
else
    echo -e "${RED}❌ Frontend ishlamayapti!${NC}"
    echo "Nginx loglarini tekshiring: sudo tail -f /var/log/nginx/error.log"
fi

echo ""
echo -e "${GREEN}🎉 Repository muvaffaqiyatli o'zgartirildi!${NC}"
echo -e "${BLUE}📍 Yangi repository: $NEW_REPO${NC}"
echo -e "${BLUE}🌍 Sayt: https://avtojon.uz${NC}"
echo ""
echo -e "${YELLOW}Foydali buyruqlar:${NC}"
echo "Repository tekshirish: git remote -v"
echo "PM2 loglar: pm2 logs avtojon-api"
echo "PM2 holat: pm2 status"
echo "Nginx loglar: sudo tail -f /var/log/nginx/error.log"
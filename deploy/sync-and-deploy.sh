#!/bin/bash

# ============================================
# GITHUB BILAN SINXRONLASH VA DEPLOY
# ============================================

set -e

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# O'zgaruvchilar
DOMAIN="avtojon.uz"
APP_DIR="/var/www/avtojon"
BACKUP_DIR="/var/backups/avtojon"

echo -e "${BLUE}🚀 GitHub bilan sinxronlash va deploy boshlandi...${NC}"

# 1. Backup yaratish
echo -e "${YELLOW}💾 Backup yaratilmoqda...${NC}"
sudo mkdir -p $BACKUP_DIR
sudo cp -r $APP_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "Backup yaratishda xatolik (normal)"

# 2. Loyiha papkasiga o'tish
cd $APP_DIR

# 3. Git holatini tekshirish
echo -e "${YELLOW}📋 Git holatini tekshirish...${NC}"
git status
echo ""

# 4. Local o'zgarishlarni saqlash (agar bor bo'lsa)
echo -e "${YELLOW}💾 Local o'zgarishlarni saqlash...${NC}"
if ! git diff --quiet; then
    echo "Local o'zgarishlar topildi, stash qilinmoqda..."
    git stash push -m "Auto stash before deploy $(date)"
fi

# 5. Remote dan yangilanishlarni olish
echo -e "${YELLOW}📥 GitHub dan yangilanishlar yuklanmoqda...${NC}"
git fetch origin
git reset --hard origin/main

# 6. Node modules tozalash va qayta o'rnatish
echo -e "${YELLOW}🧹 Dependencies tozalanmoqda va qayta o'rnatilmoqda...${NC}"

# API dependencies
cd $APP_DIR/apps/api
rm -rf node_modules package-lock.json
npm install --production

# Web dependencies
cd $APP_DIR/apps/web
rm -rf node_modules package-lock.json dist
npm install

# 7. Environment fayllarini tekshirish
echo -e "${YELLOW}🔧 Environment fayllarini tekshirish...${NC}"
if [ ! -f "$APP_DIR/apps/api/.env" ]; then
    echo -e "${RED}❌ API .env fayli topilmadi!${NC}"
    echo "Iltimos, .env faylini yarating:"
    echo "cp $APP_DIR/apps/api/.env.example $APP_DIR/apps/api/.env"
    echo "nano $APP_DIR/apps/api/.env"
    exit 1
fi

# 8. Frontend build
echo -e "${YELLOW}🔨 Frontend build qilinmoqda...${NC}"
cd $APP_DIR/apps/web
VITE_API_URL=/api npm run build

# 9. PM2 jarayonlarini to'xtatish
echo -e "${YELLOW}⏹️  PM2 jarayonlari to'xtatilmoqda...${NC}"
pm2 stop all || echo "PM2 jarayonlari topilmadi"
pm2 delete all || echo "PM2 jarayonlari o'chirilmadi"

# 10. PM2 ni qayta ishga tushirish
echo -e "${YELLOW}🔄 PM2 qayta ishga tushirilmoqda...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# 11. PM2 holatini tekshirish
echo -e "${YELLOW}📊 PM2 holatini tekshirish...${NC}"
pm2 status
pm2 logs avtojon-api --lines 10

# 12. Nginx konfiguratsiyasini tekshirish va qayta yuklash
echo -e "${YELLOW}🌐 Nginx qayta yuklanmoqda...${NC}"
sudo nginx -t
sudo systemctl reload nginx

# 13. Deployment holatini tekshirish
echo -e "${YELLOW}🔍 Deployment holatini tekshirish...${NC}"
sleep 5

# API health check
if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
    echo -e "${GREEN}✅ API ishlayapti!${NC}"
else
    echo -e "${RED}❌ API ishlamayapti!${NC}"
    echo "Loglarni tekshiring: pm2 logs avtojon-api"
fi

# Frontend check
if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}✅ Frontend ishlayapti!${NC}"
else
    echo -e "${RED}❌ Frontend ishlamayapti!${NC}"
    echo "Nginx loglarini tekshiring: sudo tail -f /var/log/nginx/error.log"
fi

echo ""
echo -e "${GREEN}🎉 Deploy tugadi!${NC}"
echo -e "${BLUE}🌍 Sayt: https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Foydali buyruqlar:${NC}"
echo "PM2 loglar: pm2 logs avtojon-api"
echo "PM2 holat: pm2 status"
echo "Nginx loglar: sudo tail -f /var/log/nginx/error.log"
echo "Nginx test: sudo nginx -t"
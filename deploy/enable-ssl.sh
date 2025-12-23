#!/bin/bash

# ============================================
# SSL SERTIFIKAT O'RNATISH
# DNS sozlangandan keyin ishga tushiring
# ============================================

set -e

DOMAIN="avtojon.uz"

echo "🔐 SSL sertifikat olinmoqda..."

# Let's Encrypt sertifikat olish
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Asosiy nginx config ga o'tkazish
sudo cp /var/www/avtojon/deploy/nginx.conf /etc/nginx/sites-available/avtojon

# Nginx qayta yuklash
sudo nginx -t && sudo systemctl reload nginx

# Auto-renewal tekshirish
sudo certbot renew --dry-run

echo "✅ SSL muvaffaqiyatli o'rnatildi!"
echo "🌍 Sayt: https://$DOMAIN"

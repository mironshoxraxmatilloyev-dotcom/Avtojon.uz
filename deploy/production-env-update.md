# Production Environment Variables Update

## VPS da /var/www/avtojon/apps/api/.env faylini yangilash kerak:

```bash
# ============================================
# PAYME TO'LOV TIZIMI - PRODUCTION
# ============================================
PAYME_SANDBOX=true  # Hozircha test rejimida qoldirish
PAYME_MERCHANT_ID=695371d43fdb81100b9bca16
PAYME_KEY=Tm3HWQH5u8JdubSPV@owRdRcv@miUeEi2IUy
PAYME_TEST_KEY=s

# Frontend URL (production)
FRONTEND_URL=https://avtojon.uz
```

## Deploy qilish:

1. VPS ga ulanish:
```bash
ssh root@avtojon.uz
```

2. Deploy script ishga tushirish:
```bash
cd /var/www/avtojon
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

3. .env faylini yangilash:
```bash
nano apps/api/.env
# Yuqoridagi o'zgarishlarni qo'shish
```

4. API ni qayta ishga tushirish:
```bash
pm2 restart avtojon-api
```

## Test qilish:

1. https://avtojon.uz ga kirish
2. Azizbek sifatida login qilish: 998999669669
3. Subscription blocker paydo bo'lishini tekshirish
4. Payme tugmasini bosib to'lov qilish

## Payme Webhook URL:
- Production: https://avtojon.uz/api/payments/payme
- Bu URL Payme merchant panelida ro'yxatdan o'tkazilgan bo'lishi kerak
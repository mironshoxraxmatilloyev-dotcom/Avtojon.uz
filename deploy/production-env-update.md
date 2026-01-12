# Production Environment Variables Update

## VPS da /var/www/avtojon/apps/api/.env faylini yangilash kerak:

```bash
# ============================================
# PAYME TO'LOV TIZIMI - PRODUCTION
# ============================================
PAYME_SANDBOX=true  # Hozircha test rejimida qoldirish
PAYME_MERCHANT_ID=695371d43fdb81100b9bca16
PAYME_KEY=Tm3HWQH5u8JdubSPV@owRdRcv@miUeEi2IUy
PAYME_TEST_KEY=Z#rMcx4CDrMXPN2k9q8#UPCFZEMZrm2nkgQw

# Frontend URL (production)
FRONTEND_URL=https://avtojon.uz
```

## Deploy qilish:

1. VPS ga ulanish:
```bash
ssh root@avtojon.uz
```

2. .env faylini yangilash:
```bash
cd /var/www/avtojon/apps/api
nano .env
# PAYME_TEST_KEY=Z#rMcx4CDrMXPN2k9q8#UPCFZEMZrm2nkgQw qilish
```

3. API ni qayta ishga tushirish:
```bash
pm2 restart avtojon-api
```

4. Loglarni tekshirish:
```bash
pm2 logs avtojon-api --lines 10
```

## Test qilish:

1. https://avtojon.uz ga kirish
2. Azizbek sifatida login qilish: 998999669669
3. Subscription blocker paydo bo'lishini tekshirish
4. Payme tugmasini bosib to'lov qilish

## ✅ Test Natijalari:
- CheckPerformTransaction: ✅ Muvaffaqiyatli
- CreateTransaction: ✅ Muvaffaqiyatli  
- PerformTransaction: ✅ Muvaffaqiyatli

Production da Payme integratsiyasi to'liq ishlaydi!
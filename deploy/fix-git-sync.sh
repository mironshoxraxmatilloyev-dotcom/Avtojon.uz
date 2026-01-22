#!/bin/bash

# ============================================
# VPS DA GIT SINXRONLASH MUAMMOSINI HAL QILISH
# ============================================

set -e

echo "🔧 Git sinxronlash muammosini hal qilish..."

# 1. Hozirgi holatni ko'rish
echo "📋 Hozirgi git holati:"
git status

echo ""
echo "🔍 O'zgargan fayllarni ko'rish:"
git diff --name-only

echo ""
echo "📦 Package.json o'zgarishlarini ko'rish:"
git diff package.json || echo "Package.json o'zgarishlari yo'q"

echo ""
echo "🧹 Git holatini tozalash va GitHub bilan sinxronlash..."

# 2. Local o'zgarishlarni bekor qilish
echo "⚠️  Local o'zgarishlarni bekor qilish..."
git checkout -- package.json
git clean -fd

# 3. GitHub dan eng so'nggi versiyani olish
echo "📥 GitHub dan eng so'nggi versiyani olish..."
git fetch origin
git reset --hard origin/main

# 4. Holatni tekshirish
echo "✅ Yangi git holati:"
git status

echo ""
echo "🎉 Git sinxronlash tugadi!"
echo "Endi deploy.sh ni ishga tushiring:"
echo "bash deploy/deploy.sh"
# Avtojon.uz

Yuk tashish kompaniyalari uchun shofyorlar va mashrutlarni boshqarish tizimi.

## 🚀 Texnologiyalar

### Backend (apps/api)
- Node.js + Express
- MongoDB + Mongoose
- JWT (Access + Refresh tokens)
- Redis (token storage, optional)
- Socket.io (real-time updates)

### Frontend (apps/web)
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Leaflet (xaritalar)

## 📦 O'rnatish

```bash
# Barcha dependencylarni o'rnatish
npm install

# Environment fayllarini yaratish
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## 🔧 Environment Variables

### API (.env)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/avtojon
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Web (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## 🏃 Ishga tushirish

```bash
# Development (API + Web)
npm run dev

# Faqat API
npm run api:dev

# Faqat Web
npm run web:dev
```

## 🧪 Testlar

```bash
# API testlarini ishga tushirish
npm test --workspace=apps/api

# Coverage bilan
npm run test:coverage --workspace=apps/api
```

## 📁 Loyiha strukturasi

```
avtojon/
├── apps/
│   ├── api/                 # Backend
│   │   ├── src/
│   │   │   ├── config/      # Database, Redis config
│   │   │   ├── middleware/  # Auth, rate limiter, error handler
│   │   │   ├── models/      # Mongoose models
│   │   │   ├── routes/      # API routes
│   │   │   ├── utils/       # JWT, validators, token manager
│   │   │   └── __tests__/   # Jest tests
│   │   └── package.json
│   └── web/                 # Frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   │   ├── drivers/ # Driver-related components
│       │   │   ├── flights/ # Flight-related components
│       │   │   └── ui/      # Shared UI components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API service
│       │   ├── store/       # Zustand stores
│       │   └── contexts/    # React contexts
│       └── package.json
└── package.json             # Root package.json (workspaces)
```

## 🔐 Xavfsizlik

- JWT Access token (15 daqiqa)
- JWT Refresh token (7 kun, Redis'da saqlanadi)
- Rate limiting (brute force himoyasi)
- Input validation (Joi)
- NoSQL injection himoyasi
- XSS himoyasi

## 📱 Asosiy funksiyalar

- ✅ Shofyorlarni boshqarish
- ✅ Mashinalarni boshqarish
- ✅ Mashrutlarni ochish va yopish
- ✅ Xarajatlarni kuzatish
- ✅ Real-time yangilanishlar (Socket.io)
- ✅ Jonli xarita
- ✅ Demo rejim

## 📄 Litsenziya

MIT

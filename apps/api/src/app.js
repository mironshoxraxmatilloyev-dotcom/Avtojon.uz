const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth.routes');
const driverRoutes = require('./routes/driver.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const expenseRoutes = require('./routes/expense.routes');
const salaryRoutes = require('./routes/salary.routes');
const driverPanelRoutes = require('./routes/driverPanel.routes');
const flightRoutes = require('./routes/flight.routes');

const app = express();

// Middleware
app.use(helmet());

// CORS sozlamalari - telefon va localhost uchun
const corsOptions = {
  origin: function (origin, callback) {
    // origin bo'lmasa (curl, postman, mobil app) ruxsat berish
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://192.168.1.100:5173',
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/ // Barcha local IP lar
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked:', origin);
      callback(null, true); // Development uchun hamma ruxsat
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/driver', driverPanelRoutes);
app.use('/api/flights', flightRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Avtojon API ishlayapti! 🚀' });
});

// Routing Proxy - Ko'p servisli real yo'l marshrutlash
const GRAPHHOPPER_API_KEY = process.env.GRAPHHOPPER_API_KEY || '';

// OSRM serverlar ro'yxati (bir nechta zaxira)
const OSRM_SERVERS = [
  'https://router.project-osrm.org',
  'https://routing.openstreetmap.de/routed-car',
  'https://routing.openstreetmap.de/routed-truck'
];

// Haversine formula
function haversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Fallback marshrut
function createStraightLineRoute(startCoords, endCoords) {
  const [lon1, lat1] = startCoords;
  const [lon2, lat2] = endCoords;
  const distance = haversineDistance(lon1, lat1, lon2, lat2) * 1000;
  const duration = (distance / 1000) * 60;
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    points.push([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t]);
  }
  return {
    code: 'Ok',
    routes: [{ geometry: { coordinates: points, type: 'LineString' }, distance, duration, isStraightLine: true }]
  };
}

// OSRM dan marshrut olish
async function tryOSRM(start, end, serverUrl) {
  const url = `${serverUrl}/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sekund timeout
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Avtojon/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) return null;
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      return data;
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// GraphHopper dan marshrut olish (bepul API)
async function tryGraphHopper(startCoords, endCoords) {
  const [lon1, lat1] = startCoords;
  const [lon2, lat2] = endCoords;
  
  // GraphHopper Maps API (bepul, cheklangan)
  const url = `https://graphhopper.com/api/1/route?point=${lat1},${lon1}&point=${lat2},${lon2}&vehicle=car&locale=uz&calc_points=true&points_encoded=false${GRAPHHOPPER_API_KEY ? '&key=' + GRAPHHOPPER_API_KEY : ''}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Avtojon/1.0' },
    signal: AbortSignal.timeout(8000)
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  
  if (data.paths && data.paths[0]) {
    const path = data.paths[0];
    return {
      code: 'Ok',
      routes: [{
        geometry: { coordinates: path.points.coordinates, type: 'LineString' },
        distance: path.distance,
        duration: path.time / 1000 // ms dan sekundga
      }]
    };
  }
  return null;
}

// Valhalla/Mapbox dan marshrut olish
async function tryValhalla(startCoords, endCoords) {
  const [lon1, lat1] = startCoords;
  const [lon2, lat2] = endCoords;
  
  // Valhalla public demo server
  const url = 'https://valhalla1.openstreetmap.de/route';
  const body = {
    locations: [
      { lat: lat1, lon: lon1 },
      { lat: lat2, lon: lon2 }
    ],
    costing: 'auto',
    directions_options: { units: 'kilometers' }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  
  if (data.trip && data.trip.legs && data.trip.legs[0]) {
    const leg = data.trip.legs[0];
    // Valhalla shape ni decode qilish kerak
    const coords = decodePolyline(leg.shape);
    return {
      code: 'Ok',
      routes: [{
        geometry: { coordinates: coords, type: 'LineString' },
        distance: data.trip.summary.length * 1000, // km dan m ga
        duration: data.trip.summary.time
      }]
    };
  }
  return null;
}

// Polyline decode (Valhalla uchun)
function decodePolyline(encoded, precision = 6) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  const factor = Math.pow(10, precision);
  
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    
    coords.push([lng / factor, lat / factor]);
  }
  return coords;
}

app.get('/api/route', async (req, res) => {
  try {
    const { start, end } = req.query;
    console.log('🗺️ Route so\'rov:', { start, end });
    
    if (!start || !end) {
      return res.status(400).json({ success: false, message: 'start va end parametrlari kerak' });
    }
    
    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);
    
    // 1. OSRM serverlarni sinab ko'rish
    for (const server of OSRM_SERVERS) {
      try {
        console.log(`🗺️ OSRM sinash: ${server}`);
        const result = await tryOSRM(start, end, server);
        if (result) {
          console.log('✅ OSRM marshrut topildi:', Math.round(result.routes[0].distance / 1000), 'km');
          return res.json(result);
        }
      } catch (e) {
        console.log(`⚠️ OSRM xato (${server}):`, e.message);
      }
    }
    
    // 2. Valhalla sinash
    try {
      console.log('🗺️ Valhalla sinash...');
      const valhallaResult = await tryValhalla(startCoords, endCoords);
      if (valhallaResult) {
        console.log('✅ Valhalla marshrut topildi:', Math.round(valhallaResult.routes[0].distance / 1000), 'km');
        return res.json(valhallaResult);
      }
    } catch (e) {
      console.log('⚠️ Valhalla xato:', e.message);
    }
    
    // 3. GraphHopper sinash
    try {
      console.log('🗺️ GraphHopper sinash...');
      const ghResult = await tryGraphHopper(startCoords, endCoords);
      if (ghResult) {
        console.log('✅ GraphHopper marshrut topildi:', Math.round(ghResult.routes[0].distance / 1000), 'km');
        return res.json(ghResult);
      }
    } catch (e) {
      console.log('⚠️ GraphHopper xato:', e.message);
    }
    
    // 4. Fallback
    console.log('📏 Fallback: to\'g\'ri chiziq...');
    const fallback = createStraightLineRoute(startCoords, endCoords);
    console.log('⚠️ Fallback marshrut:', Math.round(fallback.routes[0].distance / 1000), 'km');
    return res.json(fallback);
    
  } catch (error) {
    console.error('❌ Routing xatosi:', error.message);
    res.json({ code: 'Error', message: 'Marshrut olishda xatolik' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server xatosi'
  });
});

module.exports = app;

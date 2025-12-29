require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Connect to MongoDB
connectDB();

// HTTP server yaratish
const server = http.createServer(app);

// Socket.io sozlash
const io = new Server(server, {
  cors: {
    origin: isDev ? true : process.env.CORS_ORIGINS?.split(','),
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.io ni app ga biriktirish
app.set('io', io);

// Socket.io ulanishlar
io.on('connection', (socket) => {
  console.log(`🔌 Socket ulandi: ${socket.id}`);

  socket.on('join-business', (businessId) => {
    const room = `business-${businessId}`;
    socket.join(room);
    console.log(`💼 Business room joined: ${room} by ${socket.id}`);
  });

  socket.on('join-driver', (driverId) => {
    const room = `driver-${driverId}`;
    socket.join(room);
    console.log(`🚛 Driver room joined: ${room} by ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket uzildi: ${socket.id}`);
  });
});

// Test endpoints (faqat development uchun)
if (isDev) {
  app.get('/api/socket-test', (req, res) => {
    const rooms = {};
    io.sockets.adapter.rooms.forEach((sockets, roomName) => {
      if (!roomName.startsWith('business-') && !roomName.startsWith('driver-')) return;
      rooms[roomName] = { size: sockets.size, sockets: Array.from(sockets) };
    });
    res.json({ connectedClients: io.sockets.sockets.size, rooms });
  });

  // Test: expense-confirmed eventini yuborish
  app.get('/api/socket-test-expense/:businessId/:flightId', (req, res) => {
    const roomName = `business-${req.params.businessId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    io.to(roomName).emit('expense-confirmed', { 
      flight: { _id: req.params.flightId, test: true }, 
      expenseId: 'test-expense',
      message: 'Test: Xarajat tasdiqlandi!' 
    });
    
    io.to(roomName).emit('flight-updated', { 
      flight: { _id: req.params.flightId, test: true }, 
      message: 'Test: Flight updated!' 
    });
    
    res.json({ 
      roomName, 
      clientsCount: room?.size || 0, 
      message: 'Test xabarlar yuborildi',
      flightId: req.params.flightId
    });
  });

  app.get('/api/socket-broadcast/:businessId', (req, res) => {
    const roomName = `business-${req.params.businessId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    io.to(roomName).emit('trip-completed', { trip: { _id: 'test', status: 'completed' }, message: 'Test xabar!' });
    res.json({ roomName, clientsCount: room?.size || 0, message: 'Xabar yuborildi' });
  });
}

server.listen(PORT, '0.0.0.0', () => {
  if (isDev) {
    console.log(`🚀 Avtojon API running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
  }
});

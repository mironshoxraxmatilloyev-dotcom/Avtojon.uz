require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// HTTP server yaratish
const server = http.createServer(app);

// Socket.io sozlash - development uchun barcha originlarni qabul qilish
const io = new Server(server, {
  cors: {
    origin: true, // Barcha originlarni qabul qilish (development uchun)
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Transport sozlamalari
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  // Ping/Pong sozlamalari - ulanishni saqlab turish
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.io ni app ga biriktirish (routelarda ishlatish uchun)
app.set('io', io);

// Socket.io ulanishlar
io.on('connection', (socket) => {
  console.log('🔌 Client ulandi:', socket.id);

  // Biznesmen xonasiga qo'shilish
  socket.on('join-business', (businessId) => {
    const roomName = `business-${businessId}`;
    socket.join(roomName);
    
    // Debug: xonadagi clientlar sonini ko'rish
    const room = io.sockets.adapter.rooms.get(roomName);
    const clientsCount = room ? room.size : 0;
    console.log(`📍 Biznesmen xonasiga qo'shildi: ${roomName}, Socket: ${socket.id}, Jami: ${clientsCount}`);
  });

  // Haydovchi xonasiga qo'shilish
  socket.on('join-driver', (driverId) => {
    const roomName = `driver-${driverId}`;
    socket.join(roomName);
    
    // Debug: xonadagi clientlar sonini ko'rish
    const room = io.sockets.adapter.rooms.get(roomName);
    const clientsCount = room ? room.size : 0;
    console.log(`🚛 Haydovchi xonasiga qo'shildi: ${roomName}, Socket: ${socket.id}, Jami: ${clientsCount}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client uzildi:', socket.id, 'Sabab:', reason);
  });
});

// Test endpoint - socket xonalarini ko'rish
app.get('/api/socket-test', (req, res) => {
  const rooms = {};
  io.sockets.adapter.rooms.forEach((sockets, roomName) => {
    if (!roomName.startsWith('business-') && !roomName.startsWith('driver-')) return;
    rooms[roomName] = {
      size: sockets.size,
      sockets: Array.from(sockets)
    };
  });
  res.json({ 
    connectedClients: io.sockets.sockets.size,
    rooms 
  });
});

// Test endpoint - barcha biznesmenlaraga xabar yuborish
app.get('/api/socket-broadcast/:businessId', (req, res) => {
  const roomName = `business-${req.params.businessId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientsCount = room ? room.size : 0;
  
  io.to(roomName).emit('trip-completed', {
    trip: { _id: 'test', status: 'completed' },
    message: 'Test xabar!'
  });
  
  res.json({ 
    roomName,
    clientsCount,
    message: 'Xabar yuborildi'
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Avtojon API running on port ${PORT}`);
  console.log(`🔌 Socket.io ready`);
  console.log(`📱 Telefonda ochish: http://192.168.1.100:${PORT}`);
});

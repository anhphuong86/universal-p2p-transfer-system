const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../client/build')));

// In-memory storage (in production, use Redis/Database)
const users = new Map();
const rooms = new Map();
const activeConnections = new Map();
const fileTransfers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 8000;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (users.has(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    users.set(username, {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isOnline: false
    });

    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      user: { id: userId, username, email },
      message: 'User registered successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.get(username);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '24h' });
    
    user.isOnline = true;
    users.set(username, user);

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, email: user.email },
      message: 'Login successful' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/users', authenticateToken, (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    isOnline: user.isOnline
  }));
  res.json(userList);
});

app.get('/api/rooms', authenticateToken, (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    participants: room.participants.length,
    createdBy: room.createdBy
  }));
  res.json(roomList);
});

// Socket.IO connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User ${socket.username} connected`);
  
  // Store active connection
  activeConnections.set(socket.userId, {
    socketId: socket.id,
    username: socket.username,
    connectedAt: new Date()
  });

  // Update user online status
  const user = Array.from(users.values()).find(u => u.id === socket.userId);
  if (user) {
    user.isOnline = true;
    users.set(user.username, user);
  }

  // Broadcast user online status
  socket.broadcast.emit('user-online', {
    userId: socket.userId,
    username: socket.username
  });

  // Join room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: `Room ${roomId}`,
        participants: [],
        createdBy: socket.username,
        createdAt: new Date()
      });
    }

    const room = rooms.get(roomId);
    if (!room.participants.find(p => p.userId === socket.userId)) {
      room.participants.push({
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id
      });
    }

    socket.to(roomId).emit('user-joined', {
      userId: socket.userId,
      username: socket.username
    });

    socket.emit('room-joined', {
      roomId,
      participants: room.participants
    });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const { roomId, message, type = 'text' } = data;
    
    const messageData = {
      id: uuidv4(),
      userId: socket.userId,
      username: socket.username,
      message,
      type,
      timestamp: new Date(),
      roomId
    };

    io.to(roomId).emit('chat-message', messageData);
  });

  // Handle file transfer initiation
  socket.on('file-transfer-request', (data) => {
    const { targetUserId, fileName, fileSize, fileType, roomId } = data;
    const transferId = uuidv4();
    
    const transferData = {
      id: transferId,
      senderId: socket.userId,
      senderUsername: socket.username,
      targetUserId,
      fileName,
      fileSize,
      fileType,
      roomId,
      status: 'pending',
      createdAt: new Date()
    };

    fileTransfers.set(transferId, transferData);

    // Find target user's socket
    const targetConnection = activeConnections.get(targetUserId);
    if (targetConnection) {
      io.to(targetConnection.socketId).emit('file-transfer-request', transferData);
    }
  });

  // Handle file transfer response
  socket.on('file-transfer-response', (data) => {
    const { transferId, accepted } = data;
    const transfer = fileTransfers.get(transferId);
    
    if (transfer) {
      transfer.status = accepted ? 'accepted' : 'rejected';
      transfer.respondedAt = new Date();
      
      // Notify sender
      const senderConnection = activeConnections.get(transfer.senderId);
      if (senderConnection) {
        io.to(senderConnection.socketId).emit('file-transfer-response', {
          transferId,
          accepted,
          targetUsername: socket.username
        });
      }

      if (accepted) {
        // Start WebRTC signaling for direct transfer
        socket.emit('start-webrtc-signaling', { transferId });
        if (senderConnection) {
          io.to(senderConnection.socketId).emit('start-webrtc-signaling', { transferId });
        }
      }
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    const { targetUserId, offer, transferId } = data;
    const targetConnection = activeConnections.get(targetUserId);
    
    if (targetConnection) {
      io.to(targetConnection.socketId).emit('webrtc-offer', {
        senderId: socket.userId,
        offer,
        transferId
      });
    }
  });

  socket.on('webrtc-answer', (data) => {
    const { targetUserId, answer, transferId } = data;
    const targetConnection = activeConnections.get(targetUserId);
    
    if (targetConnection) {
      io.to(targetConnection.socketId).emit('webrtc-answer', {
        senderId: socket.userId,
        answer,
        transferId
      });
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { targetUserId, candidate, transferId } = data;
    const targetConnection = activeConnections.get(targetUserId);
    
    if (targetConnection) {
      io.to(targetConnection.socketId).emit('webrtc-ice-candidate', {
        senderId: socket.userId,
        candidate,
        transferId
      });
    }
  });

  // Handle video call
  socket.on('video-call-request', (data) => {
    const { targetUserId, roomId } = data;
    const targetConnection = activeConnections.get(targetUserId);
    
    if (targetConnection) {
      io.to(targetConnection.socketId).emit('video-call-request', {
        callerId: socket.userId,
        callerUsername: socket.username,
        roomId
      });
    }
  });

  socket.on('video-call-response', (data) => {
    const { callerId, accepted } = data;
    const callerConnection = activeConnections.get(callerId);
    
    if (callerConnection) {
      io.to(callerConnection.socketId).emit('video-call-response', {
        targetId: socket.userId,
        targetUsername: socket.username,
        accepted
      });
    }
  });

  // Handle screen sharing
  socket.on('screen-share-start', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('screen-share-start', {
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('screen-share-stop', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('screen-share-stop', {
      userId: socket.userId,
      username: socket.username
    });
  });

  // Handle clipboard sync
  socket.on('clipboard-sync', (data) => {
    const { roomId, content, type } = data;
    socket.to(roomId).emit('clipboard-sync', {
      userId: socket.userId,
      username: socket.username,
      content,
      type,
      timestamp: new Date()
    });
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('typing-start', {
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('typing-stop', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('typing-stop', {
      userId: socket.userId,
      username: socket.username
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
    
    // Remove from active connections
    activeConnections.delete(socket.userId);
    
    // Update user offline status
    const user = Array.from(users.values()).find(u => u.id === socket.userId);
    if (user) {
      user.isOnline = false;
      users.set(user.username, user);
    }

    // Remove from all rooms
    rooms.forEach((room, roomId) => {
      room.participants = room.participants.filter(p => p.userId !== socket.userId);
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      } else {
        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });

    // Broadcast user offline status
    socket.broadcast.emit('user-offline', {
      userId: socket.userId,
      username: socket.username
    });
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access the app at http://localhost:${PORT}`);
});

module.exports = { app, server, io };

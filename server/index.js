const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to allowed origins
    methods: ['GET', 'POST']
  }
});

// A simple structure to hold room data if needed, mostly we just rely on socket.io's adapter rooms.
// rooms = { roomId: { senderId: socket.id, receiverId: socket.id } }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[+] User connected ${socket.id}`);

  // Create Room
  socket.on('create-room', (roomId) => {
    socket.join(roomId);
    rooms.set(roomId, { sender: socket.id, receiver: null });
    console.log(`[Room] ${socket.id} created and joined room ${roomId}`);
    socket.emit('room-created', roomId);
  });

  // Join Room
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    // Even if room not explicitly stored in our Map, socket.io rooms exist,
    // but we use map to restrict to 2 users to be safe.
    
    if (room && !room.receiver) {
      room.receiver = socket.id;
      rooms.set(roomId, room);
      socket.join(roomId);
      console.log(`[Room] ${socket.id} joined room ${roomId}`);
      
      // Notify sender that someone joined
      socket.to(room.sender).emit('peer-joined', socket.id);
      socket.emit('room-joined', roomId);
    } else {
      socket.emit('room-error', 'Room is full or does not exist');
    }
  });

  // WebRTC Signaling: Forward Offer
  socket.on('offer', (data) => {
    const { sdp, roomId } = data;
    // Broadcast to the other person in the room
    socket.to(roomId).emit('offer', { sdp, senderId: socket.id });
  });

  // WebRTC Signaling: Forward Answer
  socket.on('answer', (data) => {
    const { sdp, roomId } = data;
    socket.to(roomId).emit('answer', { sdp, senderId: socket.id });
  });

  // WebRTC Signaling: Forward ICE Candidate
  socket.on('ice-candidate', (data) => {
    const { candidate, roomId } = data;
    socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  // Disconnect logic
  socket.on('disconnect', () => {
    console.log(`[-] User disconnected ${socket.id}`);
    
    // Cleanup any rooms this user was part of
    for (const [roomId, room] of rooms.entries()) {
      if (room.sender === socket.id || room.receiver === socket.id) {
        // Notify the other peer
        socket.to(roomId).emit('peer-left');
        rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

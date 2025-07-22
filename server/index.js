const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://poker-planning-client-six.vercel.app", 
    methods: ["GET", "POST"]
  }
});

const sessions = {}; // sessionId -> { tickets, votes: { userId: vote }, users: [] }

io.on('connection', (socket) => {
  console.log('User connected', socket.id);

socket.on('joinSession', ({ sessionId, userName, storyPoints }) => {
    
    socket.join(sessionId);

 if (!sessions[sessionId]) {
    sessions[sessionId] = {
      tickets: [],
        votes: {},
        users: [],
        hostId: socket.id,
        storyPoints: storyPoints?.length ? storyPoints : ['1', '2', '3', '5', '8', '13', '21', 'Pass'],
        selectedTicket: null,
        reveal: false
    };
  }

  const userExists = sessions[sessionId].users.find(u => u.id === socket.id);
  if (!userExists) {
    sessions[sessionId].users.push({ id: socket.id, name: userName });
  }

  io.to(sessionId).emit('sessionUpdate', {
  ...sessions[sessionId],
  hostId: sessions[sessionId].hostId
});
});
socket.on('selectTicket', ({ sessionId, ticketIndex }) => {
  const session = sessions[sessionId];
  if (socket.id !== session.hostId) return;

  session.votes = {};
  session.selectedTicket = ticketIndex;
  session.reveal = false;

  io.to(sessionId).emit('sessionUpdate', session);
});
  socket.on('castVote', ({ sessionId, userId, vote }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].votes[userId] = vote;
      io.to(sessionId).emit('votesUpdate', sessions[sessionId].votes);
    }
  });

  socket.on('addTicket', ({ sessionId, ticket }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].tickets.push(ticket);
io.to(sessionId).emit('sessionUpdate', {
  ...sessions[sessionId],
  hostId: sessions[sessionId].hostId
});    }
  });

  socket.on('revealVotes', (sessionId) => {
      io.to(sessionId).emit('revealVotes', true);
  });
socket.on('resetSession', ({ sessionId }) => {
  const session = sessions[sessionId];
  if (!session) return;

  session.votes = {};
  session.selectedTicket = null;
  session.reveal = false;

  io.to(sessionId).emit('sessionUpdate', session);
  io.to(sessionId).emit('votesUpdate', session.votes);
  io.to(sessionId).emit('revealVotes', false);
});

  socket.on('disconnecting', () => {
    // Remove user from sessions
    for (const sessionId of socket.rooms) {
      if (sessions[sessionId]) {
        sessions[sessionId].users = sessions[sessionId].users.filter(u => u.id !== socket.id);
        delete sessions[sessionId].votes[socket.id];
io.to(sessionId).emit('sessionUpdate', {
  ...sessions[sessionId],
  hostId: sessions[sessionId].hostId
});      }
    }
  });
});

server.listen(80, () => console.log('Server running on vercel'));

const { Server } = require('socket.io');

const sessions = {}; // sessionId -> { tickets, votes: { userId: vote }, users: [] }

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://poker-planning-client-six.vercel.app'); // Your frontend URL
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle the OPTIONS method (CORS preflight request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Just end the response for CORS pre-flight requests
  }

  // Initialize the Socket.IO server on the request socket server
  const io = new Server(res.socket.server);

  io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    // Handle 'joinSession' event
    socket.on('joinSession', ({ sessionId, userName, storyPoints }) => {
      socket.join(sessionId);

      // Initialize session if it doesn't exist
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

      // Add user to session if not already present
      const userExists = sessions[sessionId].users.find(u => u.id === socket.id);
      if (!userExists) {
        sessions[sessionId].users.push({ id: socket.id, name: userName });
      }

      // Emit updated session data to all users in the session
      io.to(sessionId).emit('sessionUpdate', {
        ...sessions[sessionId],
        hostId: sessions[sessionId].hostId
      });
    });

    // Handle 'selectTicket' event
    socket.on('selectTicket', ({ sessionId, ticketIndex }) => {
      const session = sessions[sessionId];
      if (socket.id !== session.hostId) return; // Only the host can select a ticket

      session.votes = {};
      session.selectedTicket = ticketIndex;
      session.reveal = false;

      // Emit updated session data to all users
      io.to(sessionId).emit('sessionUpdate', session);
    });

    // Handle 'castVote' event
    socket.on('castVote', ({ sessionId, userId, vote }) => {
      const session = sessions[sessionId];
      if (session) {
        session.votes[userId] = vote;
        io.to(sessionId).emit('votesUpdate', session.votes);
      }
    });

    // Handle 'addTicket' event
    socket.on('addTicket', ({ sessionId, ticket }) => {
      const session = sessions[sessionId];
      if (session) {
        session.tickets.push(ticket);
        io.to(sessionId).emit('sessionUpdate', {
          ...sessions[sessionId],
          hostId: sessions[sessionId].hostId
        });
      }
    });

    // Handle 'revealVotes' event
    socket.on('revealVotes', (sessionId) => {
      io.to(sessionId).emit('revealVotes', true);
    });

    // Handle 'resetSession' event
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

    // Handle 'disconnecting' event (when user disconnects)
    socket.on('disconnecting', () => {
      // Remove user from all sessions
      for (const sessionId of socket.rooms) {
        if (sessions[sessionId]) {
          sessions[sessionId].users = sessions[sessionId].users.filter(u => u.id !== socket.id);
          delete sessions[sessionId].votes[socket.id];

          // Emit updated session data to all users
          io.to(sessionId).emit('sessionUpdate', {
            ...sessions[sessionId],
            hostId: sessions[sessionId].hostId
          });
        }
      }
    });
  });

  // Attach the Socket.IO server to the HTTP server provided by Vercel
  res.socket.server.io = io;

  // End the response (since this is a serverless function)
  res.end();
};

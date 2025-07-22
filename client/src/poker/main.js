import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Box,
  Tooltip,
  Chip,
} from '@mui/material';

const socket = io('https://poker-planning-server-silk.vercel.app');

const gradientColors = [
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #fbc7aa 0%, #f6a8b6 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
];

const Main = () => {
  const { sessionId } = useParams();
  const [userName, setUserName] = useState('');
  const [votes, setVotes] = useState({});
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVote, setSelectedVote] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketLink, setNewTicketLink] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [storyPoints, setStoryPoints] = useState([]);
  const [inviteCopied, setInviteCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const points = params.get('points');
    const parsedPoints = points ? points.split(',') : null;

    if (!name) {
      navigate('/');
      return;
    }

    setUserName(name);

    socket.emit('joinSession', {
      sessionId,
      userName: name,
      storyPoints: parsedPoints,
    });

    socket.on('sessionUpdate', (data) => {
      setTickets(data.tickets);
      setUsers(data.users);
      setVotes(data.votes);
      setHostId(data.hostId);
      setStoryPoints(data.storyPoints || []);
      setSelectedTicket(data.selectedTicket ?? null);
    });

    socket.on('votesUpdate', (votes) => {
      setVotes(votes);
    });

    socket.on('revealVotes', (val) => {
      setReveal(val);
    });

    return () => {
      socket.off('sessionUpdate');
      socket.off('votesUpdate');
      socket.off('revealVotes');
    };
  }, [sessionId, navigate]);

  const castVote = (point) => {
    setSelectedVote(point);
    socket.emit('castVote', { sessionId, userId: socket.id, vote: point });
  };

  const isHost = socket.id === hostId;

  const addTicket = () => {
    if (newTicketName.trim() && newTicketLink.trim()) {
      socket.emit('addTicket', {
        sessionId,
        ticket: {
          name: newTicketName.trim(),
          link: newTicketLink.trim(),
        },
      });
      setNewTicketName('');
      setNewTicketLink('');
    }
  };

  const revealAllVotes = () => {
    socket.emit('revealVotes', sessionId);
  };

  const reset = () => {
    socket.emit('resetSession', { sessionId });
    setSelectedVote(null);
  };

  const getMostCommonVote = () => {
    const voteValues = Object.values(votes).filter(
      (v) => !isNaN(parseFloat(v))
    );

    if (voteValues.length === 0) return null;

    const frequency = {};

    voteValues.forEach((vote) => {
      frequency[vote] = (frequency[vote] || 0) + 1;
    });

    const sortedVotes = Object.entries(frequency).sort(
      (a, b) => b[1] - a[1]
    );

    return sortedVotes[0][0];
  };

  const handleInviteClick = () => {
    const baseUrl = `${window.location.origin}`;
    const inviteLink = `${baseUrl}/?sessionId=${sessionId}`;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        p: 2,
        boxSizing: 'border-box',
        bgcolor: '#f0f8ff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#1976d2' }}
      >
        Welcome, {userName}!
      </Typography>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          gap: 3,
          maxWidth: '100%',
        }}
      >
        {/* Vote Cards */}
        <Paper
          sx={{
            p: 3,
            boxShadow: 5,
            bgcolor: '#e3f2fd',
            borderRadius: 3,
            border: '2px solid #90caf9',
            flexShrink: 0,
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#0d47a1' }}
          >
            Story Points - Cast your vote
          </Typography>
          <Grid container spacing={2} justifyContent="center" wrap="wrap">
            {storyPoints.map((point, idx) => {
              const isSelected = selectedVote === point;
              const gradient = gradientColors[idx % gradientColors.length];
              return (
                <Grid item key={idx}>
                  <Card
                    onClick={() => castVote(point)}
                    sx={{
                      width: 90,
                      height: 110,
                      cursor: 'pointer',
                      bgcolor: isSelected ? gradient : 'white',
                      border: isSelected
                        ? '3px solid #1565c0'
                        : '1.5px solid #bbdefb',
                      boxShadow: isSelected
                        ? '0 4px 20px rgba(21, 101, 192, 0.6)'
                        : '0 2px 6px rgba(187, 222, 251, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      userSelect: 'none',
                      '&:hover': {
                        boxShadow: '0 6px 30px rgba(21, 101, 192, 0.8)',
                        transform: 'scale(1.07)',
                      },
                    }}
                    elevation={isSelected ? 8 : 2}
                  >
                    <CardContent>
                      <Typography
                        variant="h4"
                        align="center"
                        sx={{
                          color: isSelected ? '#e3f2fd' : '#1565c0',
                          fontWeight: '700',
                          userSelect: 'none',
                        }}
                      >
                        {point}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Bottom Section with Participants and Tickets */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'flex-start',
              width: '100%',
            }}
          >
            {/* Participants & Votes */}
            <Paper
              sx={{
                p: 3,
                boxShadow: 5,
                borderRadius: 3,
                bgcolor: '#e3f2fd',
                border: '2px solid #90caf9',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 120,
                maxHeight: 'none', 
                overflow: 'visible',
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 'bold', color: '#0d47a1' }}
              >
                Participants & Votes
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  p: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                {users.map((user) => {
                  const flipped = reveal;
                  const voteValue = votes[user.id];

                  return (
                    <li key={user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: user.id === hostId ? 'bold' : 'normal',
                          mb: 1,
                          color: '#5d4037',
                        }}
                      >
                        {user.name}
                      </Typography>

                      <Box sx={cardStyle}>
                        <Box sx={cardInnerStyle(flipped)}>
                          <Box sx={cardFrontStyle}>
                            {voteValue ? 'Voted' : 'No Vote'}
                          </Box>
                          <Box sx={cardBackStyle}>
                            {voteValue ?? 'No Vote'}
                          </Box>
                        </Box>
                      </Box>

                      {user.id === hostId && (
                        <Chip label="Host" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </li>
                  );
                })}
              </Box>
              {reveal && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Most Common Vote: {getMostCommonVote() ?? 'N/A'}
                </Alert>
              )}

              {isHost && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={revealAllVotes}
                    sx={{ fontWeight: 'bold', flex: '1 1 45%' }}
                  >
                    Reveal Votes
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={reset}
                    sx={{ fontWeight: 'bold', flex: '1 1 45%' }}
                  >
                    Reset Session
                  </Button>
                </Box>
              )}
            </Paper>

            {/* Tickets and Invite */}
            <Paper
              sx={{
                p: 3,
                boxShadow: 5,
                borderRadius: 3,
                bgcolor: '#e3f2fd',
                border: '2px solid #90caf9',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 120,
                maxHeight: 'none', 
                overflow: 'visible',
              }}
            >
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: '#0d47a1' }}
              >
                Session ID: {sessionId}
              </Typography>
              <Button
                variant="contained"
                onClick={handleInviteClick}
                sx={{ fontWeight: 'bold' }}
              >
                Copy Invite Link
              </Button>
            </Box>

            {/* Snackbar for invite copied */}
            <Snackbar
              open={inviteCopied}
              autoHideDuration={3000}
              onClose={() => setInviteCopied(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert
                onClose={() => setInviteCopied(false)}
                severity="success"
                sx={{ width: '100%' }}
              >
                Invite link copied to clipboard!
              </Alert>
            </Snackbar>

            {/* Add Ticket - Only for host */}
            {isHost && (
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Ticket Name"
                  value={newTicketName}
                  onChange={(e) => setNewTicketName(e.target.value)}
                  size="small"
                  sx={{
                    flex: '1 1 40%',
                    bgcolor: '#fff',
                    borderRadius: 1,
                  }}
                />
                <TextField
                  label="Jira Link"
                  value={newTicketLink}
                  onChange={(e) => setNewTicketLink(e.target.value)}
                  size="small"
                  sx={{
                    flex: '1 1 40%',
                    bgcolor: '#fff',
                    borderRadius: 1,
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={addTicket}
                  disabled={!newTicketName.trim() || !newTicketLink.trim()}
                >
                  Add Ticket
                </Button>
              </Box>
            )}

            {/* Selected Ticket Display */}
            {selectedTicket !== null && tickets[selectedTicket] && (
              <Paper
                elevation={3}
                sx={{
                  p: 1,
                  mb: 2,
                  bgcolor: '#90caf9',
                  borderRadius: 2,
                  fontWeight: 'bold',
                  color: '#4a148c',
                }}
              >
                Selected Ticket: {tickets[selectedTicket].name}
              </Paper>
            )}

            {/* Tickets List */}
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', color: '#0d47a1' }}
            >
              Jira Tickets
            </Typography>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                p: 0,
                mb: 0,
                overflowY: 'auto',
                flexGrow: 1,
                minHeight: 0,
              }}
            >
              {tickets.map((ticket, i) => (
                <Paper
                  key={i}
                  onClick={() => {
                    if (!isHost) return;
                    setSelectedTicket(i);
                    socket.emit('selectTicket', { sessionId, ticketIndex: i });
                  }}
                  elevation={selectedTicket === i ? 10 : 3}
                  sx={{
                    p: 1.2,
                    mb: 1.2,
                    cursor: isHost ? 'pointer' : 'default',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: selectedTicket === i ? '#90caf9' : 'white',
                    border: selectedTicket === i
                      ? '3px solid #0d47a1'
                      : '2px solid rgb(31, 84, 163)',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': isHost
                      ? {
                          bgcolor: '#42a5f5',
                          boxShadow: '0 0 12px 3px #0d47a1',
                          transform: 'scale(1)',
                        }
                      : {},
                    userSelect: 'none',
                  }}
                >
                  <Typography
                    variant="body1"
                    noWrap
                    sx={{
                      flex: 1,
                      mr: 1,
                      color: selectedTicket === i ? 'rgb(31, 84, 163)' : '#0d47a1',
                      fontWeight: '600',
                    }}
                  >
                    {ticket.name}
                  </Typography>
                  <Tooltip title="Open Jira Link">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(ticket.link, '_blank', 'noopener');
                      }}
                      sx={{
                        borderColor: 'rgb(31, 84, 163)',
                        color: '#1565c0',
                        '&:hover': {
                          borderColor: '#42a5f5',
                          color: 'rgb(31, 84, 163)',
                          bgcolor: '#fff',
                        },
                      }}
                    >
                      Open
                    </Button>
                  </Tooltip>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Main;

const cardStyle = {
  perspective: '1000px',
  width: '80px',
  height: '110px',
};

const cardInnerStyle = (flipped) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  textAlign: 'center',
  transition: 'transform 0.6s',
  transformStyle: 'preserve-3d',
  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
});

const cardFaceStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  backfaceVisibility: 'hidden',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const cardFrontStyle = {
  ...cardFaceStyle,
  backgroundColor: '#e0e0e0',
  color: '#757575',
};

const cardBackStyle = {
  ...cardFaceStyle,
  backgroundColor: '#1976d2',
  color: 'white',
  transform: 'rotateY(180deg)',
};

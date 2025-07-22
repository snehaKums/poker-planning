import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Stack,
  TextField,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import pokerLogo from'../assets/poker-planning-icon.png'

const Session = () => {
  const [mode, setMode] = useState(null);
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [sessionIdFromURL, setSessionIdFromURL] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sessionId');
    if (id) {
      setMode('join');
      setSessionIdFromURL(id);
    }
  }, []);

  const handleJoinSession = () => {
    const finalSessionId = sessionId || sessionIdFromURL;
    navigate(`/session/${finalSessionId}?name=${encodeURIComponent(userName)}`);
  };

  const handleCreateSession = () => {
    const newSessionId = Math.random().toString(36).substr(2, 6);
    const points = customPoints.trim()
      ? customPoints.split(',').map((p) => p.trim())
      : null;

    let url = `/session/${newSessionId}?name=${encodeURIComponent(userName)}`;
    if (points) {
      url += `&points=${encodeURIComponent(points.join(','))}`;
    }
    navigate(url);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={12}
        sx={{
          maxWidth: 500,
          width: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <img
            src={pokerLogo}
            alt="Poker Planning Icon"
            width={250}
            style={{ marginBottom: '1rem' }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              color: 'transparent',
              backgroundClip: 'text',
              backgroundImage: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              letterSpacing: '2px',
              mb: 1,
            }}
          >
            Poker Planning
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Let's make agile planning fun and collaborative 🎯
          </Typography>
        </Box>

        {!mode && (
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3 }}>
            <Button variant="contained" size="large" onClick={() => setMode('create')}>
              Create Session
            </Button>
            <Button variant="outlined" size="large" onClick={() => setMode('join')}>
              Join Session
            </Button>
          </Stack>
        )}

        {/* Form Fields */}
        <Box component="form" noValidate autoComplete="off">
          {mode === 'create' && (
            <>
              <TextField
                fullWidth
                label="Custom Story Points (comma separated)"
                variant="filled"
                placeholder="e.g. 1, 2, 3, 5, 8"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                sx={{ mb: 3, bgcolor: 'white', borderRadius: 1 }}
              />
              <TextField
                fullWidth
                label="Enter Your Name"
                variant="filled"
                placeholder="e.g. Alice"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                sx={{ mb: 3, bgcolor: 'white', borderRadius: 1 }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={handleCreateSession} disabled={!userName}>
                  Create
                </Button>
                <Button variant="outlined" onClick={() => setMode(null)}>
                  Back
                </Button>
              </Stack>
            </>
          )}

          {mode === 'join' && (
            <>
              <TextField
                fullWidth
                label="Enter Your Name"
                variant="filled"
                placeholder="e.g. Bob"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                sx={{ mb: 3, bgcolor: 'white', borderRadius: 1 }}
              />
              <TextField
                fullWidth
                label="Session ID"
                variant="filled"
                placeholder="Enter session ID"
                value={sessionIdFromURL || sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                disabled={!!sessionIdFromURL}
                sx={{ mb: 3, bgcolor: 'white', borderRadius: 1 }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={handleJoinSession}
                  disabled={!userName || !(sessionIdFromURL || sessionId)}
                >
                  Join
                </Button>
                <Button variant="outlined" onClick={() => setMode(null)}>
                  Back
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Session;

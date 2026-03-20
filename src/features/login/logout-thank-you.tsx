import { FunctionComponent, JSX, useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate } from 'react-router-dom';

const REDIRECT_DELAY_MS = 2000;

const LogoutThankYou: FunctionComponent = (): JSX.Element => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState<number>(REDIRECT_DELAY_MS / 1000);

  useEffect(() => {
    const redirectTimeout = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, REDIRECT_DELAY_MS);

    const countdownInterval = window.setInterval(() => {
      setSecondsLeft((current) => (current > 1 ? current - 1 : 1));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimeout);
      window.clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background:
          'radial-gradient(circle at top left, rgba(22, 119, 168, 0.16), transparent 28%), linear-gradient(180deg, #f7fafc 0%, #eef4f8 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          textAlign: 'center',
          border: '1px solid rgba(20, 62, 96, 0.08)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 68,
            height: 68,
            mx: 'auto',
            mb: 2,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            background: 'linear-gradient(180deg, #1677a8 0%, #0f5f88 100%)',
          }}
        >
          <LogoutRoundedIcon sx={{ fontSize: 32 }} />
        </Box>

        <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#16324f' }}>
          Thank you for using this system
        </Typography>
        <Typography sx={{ mt: 1.25, color: '#5d7489', lineHeight: 1.7 }}>
          You have been logged out successfully. Redirecting back to the login page in{' '}
          {secondsLeft} second{secondsLeft === 1 ? '' : 's'}.
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} sx={{ color: '#1677a8' }} />
        </Box>
      </Paper>
    </Box>
  );
};

export default LogoutThankYou;

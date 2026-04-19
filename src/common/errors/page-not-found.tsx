import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type NotFoundPageProps = {
  variant?: 'notFound' | 'unauthorized';
};

const NotFoundPage = ({ variant = 'notFound' }: NotFoundPageProps) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isUnauthorized = variant === 'unauthorized';

  const handleBackToLogin = (): void => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="88vh"         // Full viewport height
      textAlign="center"
      px={2}
      sx={{
        overflow: 'hidden',    // Prevent scrolling inside this box
        maxWidth: '100vw',     // Prevent horizontal overflow
        WebkitOverflowScrolling: 'touch', // smoother scrolling on iOS (if needed)
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        {isUnauthorized ? 'Unauthorized access' : 'Oops! Page not found'}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        {isUnauthorized
          ? "Your session has expired or you don't have permission to view this page."
          : "The page you're looking for doesn't exist or has been moved."}
      </Typography>
      {isUnauthorized ? (
        <Button
          variant="contained"
          size="large"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={handleBackToLogin}
          sx={{
            minWidth: 190,
            minHeight: 48,
            borderRadius: '14px',
            px: 3,
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
            boxShadow: '0 14px 30px rgba(32, 87, 150, 0.24)',
            background: 'linear-gradient(180deg, #2d58a6 0%, #1f4385 100%)',
            '&:hover': {
              background: 'linear-gradient(180deg, #3561b1 0%, #234a92 100%)',
              boxShadow: '0 16px 34px rgba(32, 87, 150, 0.28)',
            },
          }}
        >
          Back to Login
        </Button>
      ) : null}
    </Box>
  );
};

export default NotFoundPage;

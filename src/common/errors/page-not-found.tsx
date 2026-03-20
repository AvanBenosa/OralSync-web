import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
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
        Oops! Page not found
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
    </Box>
  );
};

export default NotFoundPage;

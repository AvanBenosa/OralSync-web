import { useEffect } from 'react';
import { Box } from '@mui/material';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './common/routes/routes';
import { useAuthStore } from './common/store/authStore';

function App() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  return (
    <Router>
      <Box display="flex" minHeight="100vh">
        <Box component="main" flexGrow={1}>
          <AppRoutes />
        </Box>
      </Box>
      <ToastContainer />
    </Router>
  );
}

export default App;

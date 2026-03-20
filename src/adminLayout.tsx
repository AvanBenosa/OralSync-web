import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useMediaQuery, useTheme } from '@mui/material';
import AdminSideNav from './common/adminNav/adminSideNav';

const AdminLayout = () => {
  const outlet = useOutlet();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default">
      <AdminSideNav />
      <Box
        component="main"
        flexGrow={1}
        sx={{
          overflowX: 'hidden',
          pt: isMobile ? '56px' : 0,
          pb: isMobile ? '56px' : 0,
        }}
      >
        <Box key={location.pathname} sx={{ minHeight: isMobile ? 'calc(100vh - 112px)' : '100vh' }}>
          {outlet}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;

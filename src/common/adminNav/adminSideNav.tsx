import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 250;
const collapsedDrawerWidth = 72;

const menuItems = [
  { label: 'Dashboard', icon: <DashboardCustomizeRoundedIcon />, path: '/admin/dashboard' },
  { label: 'Clinic Locks', icon: <LockPersonRoundedIcon />, path: '/admin/clinic-locks' },
];

const getInitials = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item.charAt(0).toUpperCase())
    .join('') || 'AP';

const formatRoleLabel = (value?: string): string =>
  value
    ?.trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ') || '';

const AdminSideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const username = useAuthStore((state) => state.username);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const activeItem = menuItems.find((item) => location.pathname.startsWith(item.path));
  const portalName = user?.clinicName?.trim() || 'Admin Portal';
  const userDisplayName = user?.name?.trim() || username || user?.email || '';
  const portalInitials = getInitials(portalName);
  const roleLabel = formatRoleLabel(user?.roleLabel || 'System Admin');

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate('/logout-success', { replace: true });
  };

  const navigationItems = (
    <>
      {menuItems.map((item) => {
        const active = location.pathname.startsWith(item.path);

        return (
          <Tooltip title={!drawerOpen ? item.label : ''} placement="right" key={item.path}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
                borderLeft: active ? '4px solid #fff' : '4px solid transparent',
                backgroundColor: active ? 'rgba(255,255,255,0.16)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: '#fff', minWidth: 0, mr: drawerOpen ? 3 : 'auto' }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen ? <ListItemText primary={item.label} /> : null}
            </ListItemButton>
          </Tooltip>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <>
        <AppBar position="fixed" color="primary" sx={{ top: 0, height: 56, justifyContent: 'center' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '56px !important' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {activeItem?.label ?? 'Admin Portal'}
            </Typography>
            <IconButton onClick={() => setLogoutDialogOpen(true)} color="inherit" aria-label="Logout">
              <LogoutRoundedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0, height: 56, justifyContent: 'center' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-around', minHeight: '56px !important' }}>
            {menuItems.map((item) => {
              const active = location.pathname.startsWith(item.path);

              return (
                <IconButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{ color: active ? '#ffe082' : 'white' }}
                >
                  {item.icon}
                </IconButton>
              );
            })}
          </Toolbar>
        </AppBar>
        <Box sx={{ pt: 7, pb: 7 }} />
        <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} fullWidth maxWidth="xs">
          <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff1f2', color: '#c62828' }}>
                <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324f' }}>
                  Confirm Logout
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#6b8095' }}>
                  End your current admin session
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ color: '#415c74', lineHeight: 1.6 }}>
              Are you sure you want to log out of the admin portal?
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2 }}>
            <Button onClick={() => setLogoutDialogOpen(false)} color="inherit" variant="text" sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button onClick={confirmLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />} sx={{ borderRadius: '10px', px: 2.25, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
              Logout
            </Button>
          </Box>
        </Dialog>
      </>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #10253d 0%, #173b5c 100%)',
          color: '#fff',
          borderRight: 'none',
          transition: 'width 0.3s',
          overflow: 'hidden',
        },
      }}
    >
      <Box display="flex" flexDirection="column" height="100%" justifyContent="space-between">
        <Box>
          <Box sx={{ p: 1.75, pb: 1.25 }}>
            {drawerOpen ? (
              <Box sx={{ position: 'relative', pr: 2.25 }}>
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.15,
                    py: 0.95,
                    borderRadius: '18px',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    boxShadow: '0 8px 18px rgba(8, 29, 48, 0.16)',
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#17344f', fontSize: '0.92rem', fontWeight: 900, letterSpacing: '0.03em', background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #dfeaf3 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }}>
                    {portalInitials}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} title={portalName} sx={{ lineHeight: 1.05, fontSize: portalName.length > 18 ? '0.9rem' : '1rem', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', pr: 0.5 }}>
                      {portalName}
                    </Typography>
                    {userDisplayName ? (
                      <Typography noWrap title={userDisplayName} sx={{ mt: 0.2, color: '#ffbb76', fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.15 }}>
                        {userDisplayName}
                      </Typography>
                    ) : null}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.45, mt: 0.18, color: 'rgba(255,255,255,0.7)', minWidth: 0 }}>
                      <PersonRoundedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                      <Typography noWrap sx={{ fontSize: '0.72rem', lineHeight: 1.1 }}>
                        {roleLabel}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDrawerOpen((current) => !current)}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 0,
                    transform: 'translate(50%, -50%)',
                    width: 30,
                    height: 30,
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backgroundColor: '#1d466d',
                    boxShadow: '0 8px 18px rgba(8, 29, 48, 0.2)',
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip title={`${portalName}${userDisplayName ? ` - ${userDisplayName}` : ''}`} placement="right">
                  <IconButton
                    size="small"
                    onClick={() => setDrawerOpen((current) => !current)}
                    sx={{
                      width: 42,
                      height: 42,
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)',
                      boxShadow: '0 10px 18px rgba(8, 29, 48, 0.16)',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {portalInitials}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
          <List>{navigationItems}</List>
        </Box>

        <Box p={2}>
          <Tooltip title={!drawerOpen ? 'Logout' : ''} placement="right">
            <Button
              variant="contained"
              fullWidth
              onClick={() => setLogoutDialogOpen(true)}
              startIcon={drawerOpen ? <LogoutRoundedIcon /> : undefined}
              sx={{
                mt: 1,
                minHeight: 38,
                px: drawerOpen ? 1.25 : 0,
                borderRadius: drawerOpen ? '12px' : '14px',
                fontWeight: 800,
                fontSize: drawerOpen ? '0.85rem' : '1rem',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'linear-gradient(180deg, #ef5350 0%, #d32f2f 100%)',
                boxShadow: '0 10px 18px rgba(115, 18, 18, 0.24)',
                border: '1px solid rgba(255,255,255,0.14)',
                justifyContent: 'center',
              }}
            >
              {drawerOpen ? 'Logout' : <LogoutRoundedIcon />}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} fullWidth maxWidth="xs">
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff1f2', color: '#c62828' }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324f' }}>
                Confirm Logout
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#6b8095' }}>
                End your current admin session
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: '#415c74', lineHeight: 1.6 }}>
            Are you sure you want to log out of the admin portal?
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit" variant="text" sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={confirmLogout} variant="contained" color="error" startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />} sx={{ borderRadius: '10px', px: 2.25, textTransform: 'none', fontWeight: 700, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
            Logout
          </Button>
        </Box>
      </Dialog>
    </Drawer>
  );
};

export default AdminSideNav;

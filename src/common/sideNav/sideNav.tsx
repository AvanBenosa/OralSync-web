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
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
const drawerWidth = 240;
const collapsedDrawerWidth = 72;
const navPalette = {
  main: '#2E6F40',
  mid: '#68BA7F',
  light: '#CFFFDC',
  dark: '#253D2C',
  hover: '#3E8756',
  active: 'rgba(207,255,220,0.18)',
};

const menuItems = [
  { label: 'Dashboard', icon: <DashboardCustomizeRoundedIcon />, path: '/dashboard' },
  { label: 'Patient', icon: <GroupAddRoundedIcon />, path: '/patient' },
  { label: 'Appointment', icon: <EventRoundedIcon />, path: '/appointment' },
  { label: 'Inventory', icon: <Inventory2RoundedIcon />, path: '/inventory' },
  { label: 'Finance Overview', icon: <MonetizationOnIcon />, path: '/finance-overview' },
];

const footerMenuItems = [{ label: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' }];

const getInitials = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item.charAt(0).toUpperCase())
    .join('') || 'DM';

const formatRoleLabel = (value?: string): string =>
  value
    ?.trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ') || '';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // const colorMode = useContext(ColorModeContext);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const username = useAuthStore((state) => state.username);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const activeItem = menuItems.find((item) => item.path === location.pathname);
  const clinicName = user?.clinicName?.trim() || 'DMD Web';
  const userDisplayName = user?.name?.trim() || username || user?.email || '';
  const clinicInitials = getInitials(clinicName);
  const roleLabel = formatRoleLabel(user?.roleLabel);
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const confirmLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate('/logout-success', { replace: true });
  };

  const openLogoutDialog = () => {
    setLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setLogoutDialogOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <AppBar
          position="fixed"
          color="primary"
          sx={{
            top: 0,
            height: 56,
            justifyContent: 'center',
            background: `linear-gradient(180deg, ${navPalette.main} 0%, ${navPalette.dark} 100%)`,
          }}
        >
          <Toolbar
            sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '56px !important' }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {activeItem?.label ?? 'DMD Web'}
            </Typography>
            <IconButton onClick={openLogoutDialog} color="inherit" aria-label="Logout">
              <LogoutRoundedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <AppBar
          position="fixed"
          color="primary"
          sx={{
            top: 'auto',
            bottom: 0,
            height: 56,
            justifyContent: 'center',
            background: `linear-gradient(180deg, ${navPalette.main} 0%, ${navPalette.dark} 100%)`,
          }}
        >
          <Toolbar
            sx={{ display: 'flex', justifyContent: 'space-around', minHeight: '56px !important' }}
          >
            {[...menuItems, ...footerMenuItems].map((item) => {
              const active = item.path === location.pathname;

              return (
                <IconButton
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ color: active ? navPalette.light : 'white' }}
                >
                  {item.icon}
                </IconButton>
              );
            })}
          </Toolbar>
        </AppBar>

        <Dialog open={logoutDialogOpen} onClose={closeLogoutDialog} fullWidth maxWidth="xs">
          <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fff1f2',
                  color: '#c62828',
                }}
              >
                <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324f' }}>
                  Confirm Logout
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#6b8095' }}>
                  End your current session on this device
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ color: '#415c74', lineHeight: 1.6 }}>
              Are you sure you want to log out? You will need to sign in again to continue.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2 }}>
            <Button
              onClick={closeLogoutDialog}
              color="inherit"
              variant="text"
              sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmLogout}
              variant="contained"
              color="error"
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: '10px',
                px: 2.25,
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Logout
            </Button>
          </Box>
        </Dialog>

        <Box sx={{ pt: 7, pb: 7 }} />
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
          background: `linear-gradient(180deg, ${navPalette.main} 0%, ${navPalette.dark} 100%)`,
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
              <Box
                sx={{
                  position: 'relative',
                  pr: 2.25,
                }}
              >
                <Box
                  sx={{
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.15,
                    py: 0.95,
                    borderRadius: '18px',
                    background:
                      'linear-gradient(145deg, rgba(207,255,220,0.14) 0%, rgba(104,186,127,0.08) 100%)',
                    border: '1px solid rgba(207,255,220,0.2)',
                    boxShadow: '0 8px 18px rgba(8, 29, 48, 0.16)',
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#17344f',
                      fontSize: '0.92rem',
                      fontWeight: 900,
                      letterSpacing: '0.03em',
                      background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${navPalette.light} 100%)`,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
                    }}
                  >
                    {clinicInitials}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={800}
                      title={clinicName}
                      sx={{
                        lineHeight: 1.05,
                        fontSize: clinicName.length > 18 ? '0.9rem' : '1rem',
                        letterSpacing: '-0.01em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        pr: 0.5,
                      }}
                    >
                      {clinicName}
                    </Typography>
                    {userDisplayName ? (
                      <Typography
                        noWrap
                        title={userDisplayName}
                        sx={{
                          mt: 0.2,
                          color: navPalette.light,
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          lineHeight: 1.15,
                        }}
                      >
                        {userDisplayName}
                      </Typography>
                    ) : null}
                    {roleLabel ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.45,
                          mt: 0.18,
                          color: 'rgba(255,255,255,0.7)',
                          minWidth: 0,
                        }}
                      >
                        <PersonRoundedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                        <Typography noWrap sx={{ fontSize: '0.72rem', lineHeight: 1.1 }}>
                          {roleLabel}
                        </Typography>
                      </Box>
                    ) : null}
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
                    border: '1px solid rgba(207,255,220,0.18)',
                    backgroundColor: navPalette.dark,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 18px rgba(8, 29, 48, 0.2)',
                    '&:hover': {
                      backgroundColor: navPalette.hover,
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip
                  title={`${clinicName}${userDisplayName ? ` - ${userDisplayName}` : ''}`}
                  placement="right"
                >
                  <IconButton
                    size="small"
                    onClick={() => setDrawerOpen((current) => !current)}
                    sx={{
                      width: 42,
                      height: 42,
                      color: '#fff',
                      border: '1px solid rgba(207,255,220,0.18)',
                      background:
                        'linear-gradient(145deg, rgba(207,255,220,0.16) 0%, rgba(104,186,127,0.08) 100%)',
                      boxShadow: '0 10px 18px rgba(8, 29, 48, 0.16)',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      letterSpacing: '0.04em',
                      '&:hover': {
                        backgroundColor: 'rgba(207,255,220,0.16)',
                      },
                    }}
                  >
                    {clinicInitials}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          <Divider sx={{ borderColor: 'rgba(207,255,220,0.16)' }} />
          <List>
            {menuItems.map((item) => {
              const active = item.path === location.pathname;

              return (
                <Tooltip title={!drawerOpen ? item.label : ''} placement="right" key={item.path}>
                  <ListItemButton
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      justifyContent: drawerOpen ? 'initial' : 'center',
                      px: 2.5,
                      borderLeft: active
                        ? `4px solid ${navPalette.light}`
                        : '4px solid transparent',
                      backgroundColor: active ? navPalette.active : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(207,255,220,0.1)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? navPalette.light : '#fff',
                        minWidth: 0,
                        mr: drawerOpen ? 3 : 'auto',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerOpen ? (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          sx: {
                            color: active ? navPalette.light : '#fff',
                            fontWeight: active ? 700 : 600,
                          },
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>

        <Box p={2}>
          {drawerOpen ? (
            <Box
              sx={{
                mb: 1.25,
                px: 0.5,
                color: 'rgba(207,255,220,0.48)',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: '0.02em',
                }}
              >
                OralSync v1.0.0 | © 2026
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontSize: '0.62rem',
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {/* © 2026 ABSoftware Solutions */}
              </Typography>
            </Box>
          ) : null}

          <List sx={{ p: 0, mb: 1 }}>
            {footerMenuItems.map((item) => {
              const active = item.path === location.pathname;

              return (
                <Tooltip title={!drawerOpen ? item.label : ''} placement="right" key={item.path}>
                  <ListItemButton
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      mb: 1,
                      justifyContent: drawerOpen ? 'initial' : 'center',
                      px: 2.5,
                      borderRadius: drawerOpen ? '14px' : '16px',
                      border: '1px solid rgba(207,255,220,0.18)',
                      background: active
                        ? 'linear-gradient(180deg, rgba(207,255,220,0.24), rgba(104,186,127,0.18))'
                        : 'linear-gradient(180deg, rgba(207,255,220,0.12), rgba(104,186,127,0.08))',
                      boxShadow: '0 10px 18px rgba(8, 29, 48, 0.14)',
                      '&:hover': {
                        background:
                          'linear-gradient(180deg, rgba(207,255,220,0.18), rgba(104,186,127,0.12))',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? navPalette.light : '#fff',
                        minWidth: 0,
                        mr: drawerOpen ? 3 : 'auto',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerOpen ? (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          sx: {
                            color: active ? navPalette.light : '#fff',
                            fontWeight: active ? 700 : 600,
                          },
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>

          {/* {drawerOpen ? (
            <FormControlLabel
              control={
                <Switch
                  checked={theme.palette.mode === 'dark'}
                  onChange={colorMode.toggleColorMode}
                  color="default"
                />
              }
              label={theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              labelPlacement="start"
              sx={{ color: '#fff', justifyContent: 'space-between', m: 0, width: '100%' }}
            />
          ) : (
            <Tooltip title="Toggle Theme">
              <IconButton onClick={colorMode.toggleColorMode} sx={{ color: '#fff', mb: 1 }}>
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          )} */}

          <Tooltip title={!drawerOpen ? 'Logout' : ''} placement="right">
            <Button
              variant="contained"
              fullWidth
              onClick={openLogoutDialog}
              startIcon={drawerOpen ? <LogoutRoundedIcon /> : undefined}
              sx={{
                mt: 1,
                minHeight: 38,
                px: drawerOpen ? 1.25 : 0,
                borderRadius: drawerOpen ? '12px' : '14px',
                fontWeight: 800,
                fontSize: drawerOpen ? '0.85rem' : '1rem',
                letterSpacing: drawerOpen ? '0.02em' : 'normal',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'linear-gradient(180deg, #ef5350 0%, #d32f2f 100%)',
                boxShadow: '0 10px 18px rgba(115, 18, 18, 0.24)',
                border: '1px solid rgba(255,255,255,0.14)',
                justifyContent: 'center',
                '&:hover': {
                  background: 'linear-gradient(180deg, #f0625f 0%, #c62828 100%)',
                  boxShadow: '0 12px 20px rgba(115, 18, 18, 0.3)',
                },
                '& .MuiButton-startIcon': {
                  mr: 0.75,

                  '& svg': {
                    fontSize: 18,
                  },
                },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.8)',
                },
              }}
            >
              {drawerOpen ? 'Logout' : <LogoutRoundedIcon />}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Dialog open={logoutDialogOpen} onClose={closeLogoutDialog} fullWidth maxWidth="xs">
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#fff1f2',
                color: '#c62828',
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324f' }}>
                Confirm Logout
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#6b8095' }}>
                End your current session on this device
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: '#415c74', lineHeight: 1.6 }}>
            Are you sure you want to log out? You will need to sign in again to continue.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, py: 2 }}>
          <Button
            onClick={closeLogoutDialog}
            color="inherit"
            variant="text"
            sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            color="error"
            startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: '10px',
              px: 2.25,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Logout
          </Button>
        </Box>
      </Dialog>
    </Drawer>
  );
};

export default SideNav;

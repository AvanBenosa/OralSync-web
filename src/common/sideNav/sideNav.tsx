import React, { useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
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
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import { isBasicSubscription } from '../utils/subscription';
import { canAccessSettingsModule } from '../utils/branch-access';
import SideNavAssistant from './side-nav-assistant';
import { GetCurrentClinicProfile } from '../../features/settings/clinic-profile/api/api';
import { ClinicProfileModel } from '../../features/settings/clinic-profile/api/types';
import { sendClinicFeedback } from '../services/clinic-feedback-api';
import { GetAppointments } from '../../features/appointment/appointment-request/api/api';
import { AppointmentStateModel } from '../../features/appointment/appointment-request/api/types';
const drawerWidth = 240;
const collapsedDrawerWidth = 72;
const sideNavFontFamily =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
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
  { label: 'Patients', icon: <GroupAddRoundedIcon />, path: '/patient' },
  { label: 'Appointments', icon: <EventRoundedIcon />, path: '/appointment' },
  { label: 'Inventories', icon: <Inventory2RoundedIcon />, path: '/inventory' },
  { label: 'Billing & Finance', icon: <MonetizationOnIcon />, path: '/finance-overview' },
  { label: 'Invoice Generator', icon: <ReceiptLongRoundedIcon />, path: '/invoice-generator' },
  { label: 'Dental Lab Cases', icon: <BiotechRoundedIcon />, path: '/dental-lab-cases' },
  { label: 'Reports', icon: <AssessmentRoundedIcon />, path: '/reports' },
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

const FEEDBACK_TYPE_OPTIONS = [
  'Feature Suggestion',
  'Bug Report',
  'General Feedback',
  'Billing Concern',
  'Other',
];

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // const colorMode = useContext(ColorModeContext);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const username = useAuthStore((state) => state.username);
  const branchId = useAuthStore((state) => state.branchId);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileModel | null>(null);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    category: FEEDBACK_TYPE_OPTIONS[0],
    subject: '',
    message: '',
    replyToEmail: '',
  });
  const visibleMenuItems = isBasicSubscription(user?.subscriptionType)
    ? menuItems.filter((item) => item.path !== '/inventory')
    : menuItems;
  const visibleFooterMenuItems = canAccessSettingsModule(user?.role) ? footerMenuItems : [];

  const activeItem = visibleMenuItems.find((item) => item.path === location.pathname);
  const clinicName = user?.clinicName?.trim() || 'OralSync';
  const userDisplayName = user?.name?.trim() || username || user?.email || '';
  const defaultBranchName = user?.defaultBranchName?.trim() || '';
  const isBranchScopedUser = user?.currentScope?.trim().toLowerCase() === 'branch';
  const contextDisplayName = (isBranchScopedUser ? defaultBranchName : clinicName) || clinicName;
  const clinicInitials = getInitials(contextDisplayName);
  const roleLabel = formatRoleLabel(user?.roleLabel);
  const clinicEmailAddress = clinicProfile?.emailAddress?.trim() || '';
  const hasValidClinicReplyEmail = isValidEmail(clinicEmailAddress);
  const effectiveReplyToEmail =
    (hasValidClinicReplyEmail ? clinicEmailAddress : '') ||
    feedbackForm.replyToEmail.trim() ||
    user?.email?.trim() ||
    '';

  useEffect(() => {
    let isMounted = true;
    let intervalRef: ReturnType<typeof setInterval> | null = null;

    const loadTodayAppointmentCount = async (forceRefresh: boolean = false): Promise<void> => {
      try {
        const response = await GetAppointments(
          {
            items: [],
            load: false,
            initial: 0,
            totalItem: 0,
            pageStart: 0,
            pageEnd: 10,
            search: '',
            dateFrom: '',
            dateTo: '',
            openModal: false,
            isUpdate: false,
            isDelete: false,
            clinicId: user?.clinicId ?? undefined,
            summaryCount: 0,
            hasDateFilter: false,
          } as AppointmentStateModel,
          forceRefresh
        );

        if (!isMounted) {
          return;
        }

        setTodayAppointmentCount(response.summaryCount ?? 0);
      } catch {
        if (!isMounted) {
          return;
        }

        setTodayAppointmentCount(0);
      }
    };

    void loadTodayAppointmentCount(false);
    intervalRef = setInterval(() => {
      void loadTodayAppointmentCount(true);
    }, 60000);

    return () => {
      isMounted = false;

      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [branchId, user?.clinicId]);

  const getMenuItemBadgeContent = (path: string): string | null => {
    if (path !== '/appointment' || todayAppointmentCount <= 0) {
      return null;
    }

    return todayAppointmentCount > 99 ? '99+' : String(todayAppointmentCount);
  };

  useEffect(() => {
    let isMounted = true;

    if (!user?.clinicId) {
      setClinicProfile(null);
      setFeedbackForm((prev) => ({
        ...prev,
        replyToEmail: prev.replyToEmail || user?.email?.trim() || '',
      }));

      return () => {
        isMounted = false;
      };
    }

    void GetCurrentClinicProfile(user.clinicId)
      .then((profile) => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(profile);
        setFeedbackForm((prev) => ({
          ...prev,
          replyToEmail:
            prev.replyToEmail || profile.emailAddress?.trim() || user?.email?.trim() || '',
        }));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setClinicProfile(null);
        setFeedbackForm((prev) => ({
          ...prev,
          replyToEmail: prev.replyToEmail || user?.email?.trim() || '',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [user?.clinicId, user?.email]);

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

  const openFeedbackDialog = () => {
    setFeedbackError('');
    setFeedbackDialogOpen(true);
    setFeedbackForm((prev) => ({
      ...prev,
      replyToEmail:
        prev.replyToEmail || clinicProfile?.emailAddress?.trim() || user?.email?.trim() || '',
    }));
  };

  const closeFeedbackDialog = () => {
    if (isSendingFeedback) {
      return;
    }

    setFeedbackDialogOpen(false);
    setFeedbackError('');
  };

  const handleFeedbackFieldChange =
    (field: 'category' | 'subject' | 'message' | 'replyToEmail') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = String(event.target.value ?? '');

      setFeedbackError('');
      setFeedbackForm((prev) => ({
        ...prev,
        [field]: nextValue,
      }));
    };

  const handleSendFeedback = async (): Promise<void> => {
    const normalizedSubject = feedbackForm.subject.trim();
    const normalizedMessage = feedbackForm.message.trim();
    const normalizedReplyToEmail = effectiveReplyToEmail.trim();

    if (!normalizedReplyToEmail) {
      setFeedbackError('Add a clinic email in Clinic Profile or enter a contact email first.');
      return;
    }

    if (!isValidEmail(normalizedReplyToEmail)) {
      setFeedbackError('Enter a valid reply-to email address.');
      return;
    }

    if (!normalizedSubject) {
      setFeedbackError('Feedback subject is required.');
      return;
    }

    if (!normalizedMessage) {
      setFeedbackError('Please enter your suggestion or feedback message.');
      return;
    }

    setIsSendingFeedback(true);
    setFeedbackError('');

    try {
      await sendClinicFeedback({
        category: feedbackForm.category,
        subject: normalizedSubject,
        message: normalizedMessage,
        replyToEmail: normalizedReplyToEmail,
      });

      setFeedbackDialogOpen(false);
      setFeedbackForm({
        category: FEEDBACK_TYPE_OPTIONS[0],
        subject: '',
        message: '',
        replyToEmail: hasValidClinicReplyEmail ? '' : user?.email?.trim() || '',
      });
    } catch {
      // API helper already shows the server error toast; keep the modal open for corrections.
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const feedbackDialog = (
    <Dialog
      open={feedbackDialogOpen}
      onClose={closeFeedbackDialog}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '18px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.25,
          fontSize: '1.1rem',
          fontWeight: 800,
          color: '#17344f',
        }}
      >
        About OralSync
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 1.75 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              border: '1px solid #d8e6f2',
              background:
                'linear-gradient(180deg, rgba(46,111,64,0.08) 0%, rgba(104,186,127,0.04) 100%)',
            }}
          >
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#17344f' }}>
              OralSync Description
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.9rem', lineHeight: 1.7, color: '#46637a' }}>
              OralSync is a cloud-based dental clinic management system built to keep patient
              records, appointments, billing, inventory, lab cases, and clinic operations in one
              connected workspace.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ alignItems: 'center' }}>
            Send feature suggestions, report issues, or share workflow feedback directly with the
            OralSync team. We send the message using the OralSync mailbox and use your clinic email
            as the reply address when it is available.
          </Alert>

          <TextField
            label="Clinic"
            value={clinicProfile?.clinicName?.trim() || clinicName}
            fullWidth
            disabled
          />

          <TextField
            label="Clinic Email On File"
            value={clinicEmailAddress || 'No clinic email saved in Clinic Profile yet'}
            fullWidth
            disabled
          />

          {!hasValidClinicReplyEmail ? (
            <TextField
              label="Reply-To Email"
              placeholder="Enter the email address we should reply to"
              value={feedbackForm.replyToEmail}
              onChange={handleFeedbackFieldChange('replyToEmail')}
              fullWidth
              required
              type="email"
              helperText="This will be used as the reply address because no valid clinic email is saved yet."
            />
          ) : null}

          <TextField
            select
            label="Feedback Type"
            value={feedbackForm.category}
            onChange={handleFeedbackFieldChange('category')}
            fullWidth
          >
            {FEEDBACK_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Subject"
            placeholder="Example: Add treatment reminders in patient dashboard"
            value={feedbackForm.subject}
            onChange={handleFeedbackFieldChange('subject')}
            fullWidth
            required
          />

          <TextField
            label="Feature Suggestion / Feedback"
            placeholder="Tell us what you need, what problem you ran into, or what will help your clinic workflow."
            value={feedbackForm.message}
            onChange={handleFeedbackFieldChange('message')}
            fullWidth
            required
            multiline
            minRows={5}
          />

          <Alert severity="success" sx={{ alignItems: 'center' }}>
            Replies from the OralSync team will go to{' '}
            <strong>{effectiveReplyToEmail || 'the email you provide above'}</strong>.
          </Alert>

          {feedbackError ? <Alert severity="error">{feedbackError}</Alert> : null}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Button
          onClick={closeFeedbackDialog}
          disabled={isSendingFeedback}
          color="inherit"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSendFeedback}
          variant="contained"
          disabled={isSendingFeedback}
          sx={{
            minWidth: 146,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          {isSendingFeedback ? (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Sending...
            </Box>
          ) : (
            'Send To OralSync'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );

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
              {activeItem?.label ?? 'OralSync'}
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
            {[...visibleMenuItems, ...visibleFooterMenuItems].map((item) => {
              const active = item.path === location.pathname;
              const badgeContent = getMenuItemBadgeContent(item.path);

              return (
                <IconButton
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ color: active ? navPalette.light : 'white' }}
                >
                  {badgeContent ? (
                    <Badge
                      badgeContent={badgeContent}
                      overlap="circular"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#ffb300',
                          color: '#17344f',
                          fontWeight: 800,
                          minWidth: 18,
                          height: 18,
                          fontSize: '0.64rem',
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
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

        {feedbackDialog}

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
                      title={contextDisplayName}
                      sx={{
                        lineHeight: 1.05,
                        fontSize: contextDisplayName.length > 18 ? '0.9rem' : '1rem',
                        letterSpacing: '-0.01em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        pr: 0.5,
                      }}
                    >
                      {contextDisplayName}
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
                  title={`${contextDisplayName}${userDisplayName ? ` - ${userDisplayName}` : ''}`}
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
            {visibleMenuItems.map((item) => {
              const active = item.path === location.pathname;
              const badgeContent = getMenuItemBadgeContent(item.path);
              const iconNode = badgeContent ? (
                <Badge
                  badgeContent={badgeContent}
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ffb300',
                      color: '#17344f',
                      fontWeight: 800,
                      minWidth: 18,
                      height: 18,
                      fontSize: '0.64rem',
                    },
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              );

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
                      {iconNode}
                    </ListItemIcon>
                    {drawerOpen ? (
                      <ListItemText
                        primary={item.label}
                        secondary={
                          item.path === '/appointment' && todayAppointmentCount > 0
                            ? `${todayAppointmentCount} today`
                            : undefined
                        }
                        primaryTypographyProps={{
                          sx: {
                            fontFamily: sideNavFontFamily,
                            color: active ? navPalette.light : '#fff',
                            fontWeight: active ? 700 : 600,
                          },
                        }}
                        secondaryTypographyProps={{
                          sx: {
                            fontFamily: sideNavFontFamily,
                            color: 'rgba(255,255,255,0.76)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
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
          <Box sx={{ mb: drawerOpen ? 1.4 : 0.25 }}>
            <SideNavAssistant drawerOpen={drawerOpen} />
          </Box>

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
                component="button"
                type="button"
                onClick={openFeedbackDialog}
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: '0.02em',
                  width: '100%',
                  px: 1,
                  py: 0.7,
                  border: '1px solid rgba(207,255,220,0.12)',
                  borderRadius: '12px',
                  background: 'rgba(207,255,220,0.05)',
                  color: 'rgba(207,255,220,0.76)',
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                  '&:hover': {
                    background: 'rgba(207,255,220,0.1)',
                    color: '#ffffff',
                  },
                }}
              >
                OralSync v1.0.0 (Beta) | (c) 2026
              </Typography>
              <Typography
                sx={{
                  mt: 0.2,
                  fontSize: '0.62rem',
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                About OralSync and send feature suggestions
              </Typography>
            </Box>
          ) : null}

          <List sx={{ p: 0, mb: 1 }}>
            {visibleFooterMenuItems.map((item) => {
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
                            fontFamily: sideNavFontFamily,
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

      {feedbackDialog}

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

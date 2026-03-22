import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos, Visibility, VisibilityOff } from '@mui/icons-material';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, type AuthResponse } from '../../common/services/auth-api';
import { toastSuccess } from '../../common/api/responses';
import { useAuthStore } from '../../common/store/authStore';
import { getPortalHomePath, getUserPortalType } from '../../common/utils/portal';
import { DEVOTIONAL_HIDDEN_KEY } from '../dashboard/api/devotional';
import ClinicRegistrationForm from './clinic-registration-form';
import RegistrationSuccessPanel from './registration-success-panel';

const REMEMBER_ME_STORAGE_KEY = 'dmd-web-login-credentials';

const carouselSlides = [
  {
    title: 'Patient Records Made Clear',
    description:
      'Track consultations, admissions, and visit history in one place with a cleaner workflow for staff.',
    image: '',
  },
  {
    title: 'Built For Daily Operations',
    description:
      'Keep registration, billing, and patient movement aligned with a dashboard designed for fast decisions.',
    image: '',
  },
  {
    title: 'Ready For Multi-Clinic Use',
    description:
      'Keep the seeded demo login for quick previews while new clinics register directly from this landing page.',
    image: '',
  },
];

type AuthMode = 'login' | 'register';

type RegistrationSuccessState = {
  clinicName?: string;
  userName?: string;
};

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccessState | null>(
    null
  );

  useEffect(() => {
    const storedCredentials = window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY);

    if (!storedCredentials) {
      return;
    }

    try {
      const parsedCredentials = JSON.parse(storedCredentials) as {
        username?: string;
        password?: string;
      };

      setUsername(parsedCredentials.username ?? '');
      setPassword(parsedCredentials.password ?? '');
      setRememberMe(Boolean(parsedCredentials.username || parsedCredentials.password));
    } catch {
      window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselSlides.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [isMobile]);

  const handlePreviousSlide = () => {
    setActiveSlide((current) => (current === 0 ? carouselSlides.length - 1 : current - 1));
  };

  const handleNextSlide = () => {
    setActiveSlide((current) => (current + 1) % carouselSlides.length);
  };

  const handleLoginSuccess = (response: AuthResponse): void => {
    window.sessionStorage.removeItem(DEVOTIONAL_HIDDEN_KEY);
    setSession(
      response.token,
      response.user?.name || response.user?.userName || response.user?.email,
      response.requiresRegistration,
      response.user
    );
    navigate(getPortalHomePath(getUserPortalType(response.user)), { replace: true });
  };

  const handleRegistrationSuccess = (response: AuthResponse): void => {
    setRegistrationSuccess({
      clinicName: response.user?.clinicName,
      userName: response.user?.userName || response.user?.email,
    });
    toastSuccess('Account has been created successfully.');
  };

  const handleBackToLogin = (): void => {
    setRegistrationSuccess(null);
    setAuthMode('login');
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const identifier = username.trim();
      const response = await loginUser({
        username: identifier,
        email: identifier,
        password,
      });

      if (rememberMe) {
        window.localStorage.setItem(
          REMEMBER_ME_STORAGE_KEY,
          JSON.stringify({ username: identifier, password })
        );
      } else {
        window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
      }

      handleLoginSuccess(response);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSlide = carouselSlides[activeSlide];
  const isRegisterMode = authMode === 'register';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #e7f0f7 0%, #f9fbfd 55%, #eef6fb 100%)',
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: isTablet ? 4 : 6,
          background:
            'radial-gradient(circle at top left, rgba(109, 187, 255, 0.28), transparent 34%), linear-gradient(160deg, #0b2942 0%, #114a72 52%, #1677a8 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 680,
            color: 'white',
          }}
        >
          <Chip
            label="OralSync"
            sx={{
              mb: 3,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          />
          <Typography
            variant={isTablet ? 'h4' : 'h3'}
            fontWeight={800}
            sx={{ maxWidth: 520, lineHeight: 1.1, mb: 2 }}
          >
            {currentSlide.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: 520, color: 'rgba(255,255,255,0.82)', mb: 4 }}
          >
            {currentSlide.description}
          </Typography>

          <Box
            sx={{
              position: 'relative',
              minHeight: 390,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 24px 60px rgba(2, 12, 27, 0.32)',
              background: currentSlide.image
                ? `linear-gradient(180deg, rgba(3, 22, 37, 0.08), rgba(3, 22, 37, 0.52)), url(${currentSlide.image}) center/cover`
                : 'linear-gradient(140deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: currentSlide.image
                  ? 'transparent'
                  : 'radial-gradient(circle at top right, rgba(133, 217, 255, 0.42), transparent 28%), radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.18), transparent 24%)',
              }}
            />
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                p: 4,
              }}
            >
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Multi-Clinic Rollout
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
                  Demo login and real clinic onboarding
                </Typography>
                <Typography variant="body2" sx={{ maxWidth: 360, color: 'rgba(255,255,255,0.82)' }}>
                  Use the seeded admin for demo deployments, or let each clinic self-register from
                  the landing page with a verification code.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 3,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              {carouselSlides.map((slide, index) => (
                <Box
                  key={slide.title}
                  onClick={() => setActiveSlide(index)}
                  sx={{
                    width: index === activeSlide ? 34 : 10,
                    height: 10,
                    borderRadius: 999,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    backgroundColor: index === activeSlide ? 'white' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handlePreviousSlide}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <ArrowBackIosNew fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleNextSlide}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          p: isMobile ? 0 : 4,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(23, 119, 168, 0.08), transparent 26%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.08), transparent 28%)',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: isRegisterMode ? 720 : 500,
            px: isMobile ? 0 : undefined,
          }}
        >
          {isMobile ? (
            <Box
              sx={{
                px: 2.5,
                pt: 2,
                pb: 1,
                background:
                  'linear-gradient(180deg, #0f4e76 0%, #1677a8 58%, rgba(22, 119, 168, 0.12) 100%)',
              }}
            >
              <Box
                sx={{
                  p: 2.25,
                  minHeight: 182,
                  maxHeight: 182,
                  borderRadius: 4,
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 18px 40px rgba(5, 22, 41, 0.18)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ letterSpacing: 2.2, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}
                >
                  CONNECT OralSync
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{
                    mt: 0.5,
                    mb: 0.75,
                    fontSize: 'clamp(1.6rem, 5vw, 2rem)',
                    lineHeight: 1.12,
                  }}
                >
                  {currentSlide.title}
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.82)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {currentSlide.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {carouselSlides.map((slide, index) => (
                    <Box
                      key={slide.title}
                      onClick={() => setActiveSlide(index)}
                      sx={{
                        width: index === activeSlide ? 26 : 8,
                        height: 8,
                        borderRadius: 999,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        backgroundColor: index === activeSlide ? 'white' : 'rgba(255,255,255,0.35)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          ) : null}

          <Paper
            elevation={3}
            sx={{
              position: 'relative',
              zIndex: 1,
              p: { xs: 3, sm: 4.5 },
              pt: { xs: 3, sm: 4.5 },
              width: '100%',
              maxWidth: isRegisterMode ? 720 : 500,
              maxHeight: isMobile ? 'none' : 'calc(100vh - 64px)',
              overflowY: isRegisterMode ? 'auto' : 'visible',
              borderRadius: isMobile ? '28px 28px 0 0' : 5,
              border: '1px solid rgba(19, 71, 107, 0.08)',
              boxShadow: isMobile
                ? '0 -10px 30px rgba(15, 23, 42, 0.06)'
                : '0 24px 60px rgba(15, 23, 42, 0.12)',
              minHeight: isMobile ? 'calc(100vh - 185px)' : 'auto',
              mt: isMobile ? -0.5 : 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: '#1677a8',
                letterSpacing: 2.4,
                fontWeight: 700,
                mb: 1,
              }}
            >
              CONNECT OralSync
            </Typography>

            <Typography
              variant="body2"
              align="center"
              sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto', mb: 3 }}
            >
              {isRegisterMode
                ? 'Create a clinic and its super admin directly from the landing page. The seeded demo account flow stays available after deployment.'
                : 'Access your clinic management workspace with your account credentials.'}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 1,
                mb: 3,
                p: 0.75,
                borderRadius: 3,
                backgroundColor: 'rgba(22, 119, 168, 0.08)',
              }}
            >
              <Button
                variant={authMode === 'login' ? 'contained' : 'text'}
                onClick={() => setAuthMode('login')}
              >
                Login
              </Button>
              <Button
                variant={authMode === 'register' ? 'contained' : 'text'}
                onClick={() => setAuthMode('register')}
              >
                Register Clinic
              </Button>
            </Box>

            {isRegisterMode ? (
              registrationSuccess ? (
                <RegistrationSuccessPanel
                  clinicName={registrationSuccess.clinicName}
                  userName={registrationSuccess.userName}
                  onBackToLogin={handleBackToLogin}
                />
              ) : (
                <ClinicRegistrationForm onSuccess={handleRegistrationSuccess} />
              )
            ) : (
              <form
                onSubmit={handleLoginSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                <TextField
                  label="Email or Username"
                  fullWidth
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            edge="end"
                            onClick={() => setShowPassword((current) => !current)}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      sx={{ color: '#1677a8' }}
                    />
                  }
                  label="Remember me"
                  sx={{
                    mt: -1,
                    color: 'text.secondary',
                    '& .MuiFormControlLabel-label': {
                      fontSize: 14,
                    },
                  }}
                />
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Login'}
                </Button>
              </form>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;

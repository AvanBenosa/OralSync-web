import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  alpha,
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { FunctionComponent, JSX } from 'react';
import { type AuthResponse } from '../../common/services/auth-api';
import { authPalette, authPrimaryGradient, authSurfaceGradient } from './auth-palette';
import ClinicRegistrationForm from './clinic-registration-form';
import RegistrationSuccessPanel from './registration-success-panel';

type RegistrationSuccessState = {
  clinicName?: string;
  userName?: string;
};

type AuthLoginCardProps = {
  activeSection: 'home' | 'documentation' | 'contact';
  authMode: 'login' | 'register' | 'forgotPassword';
  emailAddress: string;
  errorMessage: string;
  facebookUrl: string;
  isSubmitting: boolean;
  isMobileView: boolean;
  onAuthModeChange: (mode: 'login' | 'register' | 'forgotPassword') => void;
  onBackToLogin: () => void;
  onShowContact: () => void;
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRegistrationSuccess: (response: AuthResponse) => void;
  password: string;
  phoneNumber: string;
  registrationSuccess: RegistrationSuccessState | null;
  rememberMe: boolean;
  setPassword: (value: string) => void;
  setRememberMe: (value: boolean) => void;
  setShowPassword: (value: boolean) => void;
  setUsername: (value: string) => void;
  showPassword: boolean;
  username: string;
  versionLabel: string;
  // Forgot password
  forgotIdentifier: string;
  setForgotIdentifier: (value: string) => void;
  forgotSubmitting: boolean;
  forgotMessage: string;
  forgotIsError: boolean;
  onForgotPasswordSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
};

const LOCKOUT_PREFIX = 'LOCKOUT:';

function parseLockoutMessage(raw: string): { isLockout: boolean; displayText: string } {
  if (raw.startsWith(LOCKOUT_PREFIX)) {
    return { isLockout: true, displayText: raw.slice(LOCKOUT_PREFIX.length) };
  }
  return { isLockout: false, displayText: raw };
}

const AuthLoginCard: FunctionComponent<AuthLoginCardProps> = ({
  activeSection,
  authMode,
  emailAddress,
  errorMessage,
  facebookUrl,
  isSubmitting,
  isMobileView,
  onAuthModeChange,
  onBackToLogin,
  onShowContact,
  onLoginSubmit,
  onRegistrationSuccess,
  password,
  phoneNumber,
  registrationSuccess,
  rememberMe,
  setPassword,
  setRememberMe,
  setShowPassword,
  setUsername,
  showPassword,
  username,
  versionLabel,
  forgotIdentifier,
  setForgotIdentifier,
  forgotSubmitting,
  forgotMessage,
  forgotIsError,
  onForgotPasswordSubmit,
}): JSX.Element => {
  const theme = useTheme();
  const isRegisterMode = authMode === 'register';
  const isForgotPasswordMode = authMode === 'forgotPassword';
  const showMobileContactPanel = isMobileView && activeSection === 'contact';

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: { xs: 'stretch', md: 'center' },
        px: { xs: 2, sm: 3.5, lg: 5 },
        py: { xs: 2.5, sm: 3.5, md: 5 },
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(104,186,127,0.12), transparent 28%), linear-gradient(180deg, #0f1713 0%, #16211a 100%)'
            : 'radial-gradient(circle at top left, rgba(104,186,127,0.12), transparent 28%), linear-gradient(180deg, #f6fbf7 0%, #eef7f0 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top right, rgba(104,186,127,0.12), transparent 20%), radial-gradient(circle at bottom left, rgba(46,111,64,0.08), transparent 24%)',
        }}
      />

      <Box
        id="auth-card"
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: isRegisterMode ? 760 : 520,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
        }}
      >
        {showMobileContactPanel ? (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              p: 2.25,
              borderRadius: 4,
              border: `1px solid ${authPalette.border}`,
              background: authSurfaceGradient,
              boxShadow: '0 18px 36px rgba(18, 38, 28, 0.1)',
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: authPalette.primary,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              Contact Us
            </Typography>
            <Typography
              sx={{
                mt: 0.7,
                fontSize: 22,
                fontWeight: 800,
                color: authPalette.text,
              }}
            >
              Reach OralSync support
            </Typography>
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <MobileContactRow
                href={`mailto:${emailAddress}`}
                icon={<EmailRoundedIcon fontSize="small" />}
                label="Email"
                value={emailAddress}
              />
              <MobileContactRow
                href="tel:+639765628426"
                icon={<PhoneRoundedIcon fontSize="small" />}
                label="Phone"
                value={phoneNumber}
              />
              <MobileContactRow
                href={facebookUrl}
                icon={<FacebookRoundedIcon fontSize="small" />}
                label="Facebook"
                value="Open Facebook Profile"
                external
              />
            </Stack>
          </Paper>
        ) : null}

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            component="img"
            src="/OralSync.png"
            alt="OralSync logo"
            sx={{
              width: { xs: 86, sm: 102 },
              height: { xs: 86, sm: 102 },
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 30px rgba(37, 61, 44, 0.14))',
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <ChipLike label={versionLabel} />
          <ChipLike label="BETA" emphasis />
        </Stack>

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: { xs: 2.5, sm: 3.75 },
            borderRadius: { xs: 4, sm: 5 },
            border: `1px solid ${authPalette.border}`,
            background: authSurfaceGradient,
            boxShadow: '0 28px 60px rgba(18, 38, 28, 0.12)',
          }}
        >
          {isForgotPasswordMode ? (
            <>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => onAuthModeChange('login')}
                  sx={{ color: authPalette.primary }}
                  aria-label="Back to login"
                >
                  <ArrowBackRoundedIcon fontSize="small" />
                </IconButton>
                <Typography variant="overline" sx={{ color: authPalette.primary, fontWeight: 800, letterSpacing: 2.4 }}>
                  Reset Password
                </Typography>
              </Stack>
              <Typography sx={{ mb: 2.5, color: theme.palette.text.secondary, fontSize: 15 }}>
                Enter your email or username and we'll send a temporary password to your registered email address.
              </Typography>
              <Box component="form" onSubmit={onForgotPasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {forgotMessage ? (
                  <Alert severity={forgotIsError ? 'error' : 'success'}>{forgotMessage}</Alert>
                ) : null}
                <TextField
                  label="Email or Username"
                  placeholder="Enter your email or username"
                  fullWidth
                  required
                  autoComplete="username"
                  value={forgotIdentifier}
                  onChange={(event) => setForgotIdentifier(event.target.value)}
                  sx={fieldSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineRoundedIcon sx={{ color: authPalette.textSoft }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={forgotSubmitting}
                  endIcon={!forgotSubmitting ? <ArrowForwardRoundedIcon /> : undefined}
                  sx={{
                    minHeight: 50,
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: 16,
                    textTransform: 'none',
                    background: authPrimaryGradient,
                    boxShadow: authPalette.buttonShadow,
                  }}
                >
                  {forgotSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Send Temporary Password'}
                </Button>
                <Button
                  type="button"
                  onClick={() => onAuthModeChange('login')}
                  sx={{ color: authPalette.primary, fontWeight: 700, textTransform: 'none' }}
                >
                  Back to Login
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  color: authPalette.primary,
                  letterSpacing: 2.4,
                  fontWeight: 800,
                }}
              >
                {isRegisterMode ? 'Create Clinic Workspace' : 'Welcome Back'}
              </Typography>
              <Typography
                align="center"
                sx={{
                  mt: 1.25,
                  mb: 3,
                  color: theme.palette.text.secondary,
                  fontSize: 15,
                }}
              >
                {isRegisterMode
                  ? 'Create a clinic and seed the first super admin account from the public landing page.'
                  : 'Access your clinic management workspace with your account credentials.'}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1,
                  p: 0.75,
                  mb: 3,
                  borderRadius: 3,
                  backgroundColor: alpha(authPalette.primary, 0.08),
                }}
              >
                <Button
                  variant={authMode === 'login' ? 'contained' : 'text'}
                  onClick={() => onAuthModeChange('login')}
                  sx={getModeButtonSx(authMode === 'login')}
                >
                  Login
                </Button>
                <Button
                  variant={authMode === 'register' ? 'contained' : 'text'}
                  onClick={() => onAuthModeChange('register')}
                  sx={getModeButtonSx(authMode === 'register')}
                >
                  Register Clinic
                </Button>
              </Box>

              {isRegisterMode ? (
                registrationSuccess ? (
                  <RegistrationSuccessPanel
                    clinicName={registrationSuccess.clinicName}
                    userName={registrationSuccess.userName}
                    onBackToLogin={onBackToLogin}
                  />
                ) : (
                  <ClinicRegistrationForm onSuccess={onRegistrationSuccess} />
                )
              ) : (
                <Box component="form" onSubmit={onLoginSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
                  {errorMessage ? (() => {
                    const { isLockout, displayText } = parseLockoutMessage(errorMessage);
                    if (isLockout) {
                      return (
                        <Alert
                          severity="warning"
                          icon={<LockOutlinedIcon fontSize="inherit" />}
                          sx={{ alignItems: 'flex-start' }}
                        >
                          <strong>{displayText}</strong>
                        </Alert>
                      );
                    }
                    return <Alert severity="error">{displayText}</Alert>;
                  })() : null}
                  <TextField
                    label="Email or Username"
                    placeholder="Enter your email or username"
                    fullWidth
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRoundedIcon sx={{ color: authPalette.textSoft }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    label="Password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: authPalette.textSoft }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(event) => setRememberMe(event.target.checked)}
                          sx={{
                            color: authPalette.primary,
                            '&.Mui-checked': {
                              color: authPalette.primary,
                            },
                          }}
                        />
                      }
                      label="Remember me"
                      sx={{
                        ml: -0.5,
                        color: theme.palette.text.secondary,
                        '& .MuiFormControlLabel-label': {
                          fontSize: 14,
                        },
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => onAuthModeChange('forgotPassword')}
                      sx={{
                        px: 0,
                        minWidth: 'auto',
                        color: authPalette.primary,
                        fontWeight: 700,
                        textTransform: 'none',
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Stack>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting}
                    endIcon={!isSubmitting ? <ArrowForwardRoundedIcon /> : undefined}
                    sx={{
                      minHeight: 50,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: 16,
                      textTransform: 'none',
                      background: authPrimaryGradient,
                      boxShadow: authPalette.buttonShadow,
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Login'}
                  </Button>

                  <Typography
                    align="center"
                    sx={{
                      fontSize: 13,
                      color: theme.palette.text.secondary,
                      lineHeight: 1.6,
                    }}
                  >
                    {isMobileView
                      ? 'Need help? Use the menu or email support directly for account assistance.'
                      : 'Need help? Open the Contact Us panel from the left side for email, phone, and Facebook support details.'}
                  </Typography>
                </Box>
              )}
            </>
          )}

        </Paper>
      </Box>
    </Box>
  );
};

const ChipLike = ({
  emphasis,
  label,
}: {
  emphasis?: boolean;
  label: string;
}): JSX.Element => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: 30,
      px: 1.2,
      borderRadius: 999,
      border: `1px solid ${emphasis ? alpha(authPalette.mid, 0.28) : authPalette.border}`,
      backgroundColor: emphasis ? alpha(authPalette.mid, 0.14) : 'rgba(255,255,255,0.7)',
      color: emphasis ? authPalette.primary : authPalette.textSoft,
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.2,
    }}
  >
    {label}
  </Box>
);

const getModeButtonSx = (active: boolean) => ({
  minHeight: 46,
  borderRadius: 2.25,
  py: 1.15,
  fontWeight: 800,
  color: active ? '#ffffff' : authPalette.dark,
  background: active ? authPrimaryGradient : 'transparent',
  boxShadow: active ? authPalette.buttonShadow : 'none',
  textTransform: 'none',
  '&:hover': {
    background: active ? authPrimaryGradient : alpha(authPalette.primary, 0.08),
    boxShadow: active ? authPalette.buttonShadow : 'none',
  },
});

export default AuthLoginCard;

const MobileContactRow = ({
  external,
  href,
  icon,
  label,
  value,
}: {
  external?: boolean;
  href: string;
  icon: JSX.Element;
  label: string;
  value: string;
}): JSX.Element => (
  <Box
    component="a"
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noreferrer' : undefined}
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.25,
      p: 1.4,
      borderRadius: 3,
      textDecoration: 'none',
      border: `1px solid ${alpha(authPalette.primary, 0.1)}`,
      backgroundColor: alpha('#ffffff', 0.82),
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2.5,
        color: authPalette.primary,
        backgroundColor: alpha(authPalette.primary, 0.08),
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box minWidth={0}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: authPalette.textSoft,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.35,
          fontWeight: 700,
          color: authPalette.text,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

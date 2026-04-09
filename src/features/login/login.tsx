import { Box, useMediaQuery, useTheme } from '@mui/material';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastSuccess } from '../../common/api/responses';
import { queuePostLoginBoot } from '../../common/loading/post-login-boot';
import { loginUser, type AuthResponse } from '../../common/services/auth-api';
import { useAuthStore } from '../../common/store/authStore';
import { getPortalHomePath, getUserPortalType } from '../../common/utils/portal';
import { DEVOTIONAL_HIDDEN_KEY } from '../dashboard/api/devotional';
import AuthHeroPanel, {
  authHeroDocumentationItems,
  authHeroDefaultHighlights,
  createAuthHeroContactItems,
  type AuthHeroSlide,
} from './auth-hero-panel';
import AuthLoginCard from './auth-login-card';
import AuthTopNav from './auth-top-nav';

const REMEMBER_ME_STORAGE_KEY = 'dmd-web-login-credentials';
const CONTACT_PHONE_NUMBER = '+63 976 562 8426';
const CONTACT_EMAIL_ADDRESS = 'evanbenosa45@gmail.com';
const CONTACT_FACEBOOK_URL =
  'https://www.facebook.com/evan.is.deads?mibextid=wwXIfr&rdid=m2CKYAoANdb5WhcF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19rWefzSDX%2F%3Fmibextid%3DwwXIfr';

const heroSlides: AuthHeroSlide[] = [
  {
    badge: 'DENTAL MANAGEMENT, SIMPLIFIED',
    titlePrimary: 'Built For Daily',
    titleAccent: 'Operations',
    description:
      'Keep registration, billing, and patient movement aligned with a workspace designed for front desk speed and chairside clarity.',
    eyebrow: 'Clinic Operations Snapshot',
    promoTag: 'MULTI-CLINIC ROLLOUT',
    promoTitle: 'Real clinic onboarding',
    promoDescription:
      'Launch a clinic workspace, assign the first super admin, and centralize appointments, records, and billing from day one.',
    metrics: [
      {
        label: 'Today',
        value: '12',
        meta: '+2 appointments from yesterday',
      },
      {
        label: 'Revenue',
        value: 'PHP 285K',
        meta: 'Monthly collections snapshot',
      },
      {
        label: 'Access',
        value: 'Cloud',
        meta: 'Team-ready from any workstation',
      },
    ],
  },
  {
    badge: 'CARE DELIVERY, CONNECTED',
    titlePrimary: 'Operate With',
    titleAccent: 'Confidence',
    description:
      'Move from patient intake to treatment documentation with a calmer operational flow, clearer records, and fewer disconnected tools.',
    eyebrow: 'Clinic Visibility Layer',
    promoTag: 'LIVE DASHBOARD VIEW',
    promoTitle: 'One workspace for staff',
    promoDescription:
      'Give reception, doctors, and clinic managers a shared system for schedules, charts, lab cases, subscriptions, and billing.',
    metrics: [
      {
        label: 'Patients',
        value: '1.4K',
        meta: 'Profiles organized per clinic',
      },
      {
        label: 'Insights',
        value: 'Real-time',
        meta: 'Surface activity as it happens',
      },
      {
        label: 'Compliance',
        value: 'Protected',
        meta: 'Built for secure clinic workflows',
      },
    ],
  },
];

const topNavItems = [
  { id: 'home', label: 'Home' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'contact', label: 'Contact Us' },
];

type AuthMode = 'login' | 'register';
type AuthSection = 'home' | 'documentation' | 'contact';

type RegistrationSuccessState = {
  clinicName?: string;
  userName?: string;
};

const Login = () => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeSection, setActiveSection] = useState<AuthSection>('home');
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
        password?: string;
        username?: string;
      };

      setUsername(parsedCredentials.username ?? '');
      setPassword(parsedCredentials.password ?? '');
      setRememberMe(Boolean(parsedCredentials.username || parsedCredentials.password));
    } catch {
      window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (isCompact) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isCompact]);

  const handlePreviousSlide = (): void => {
    setActiveSlide((current) => (current === 0 ? heroSlides.length - 1 : current - 1));
  };

  const handleNextSlide = (): void => {
    setActiveSlide((current) => (current + 1) % heroSlides.length);
  };

  const handleLoginSuccess = (response: AuthResponse): void => {
    window.sessionStorage.removeItem(DEVOTIONAL_HIDDEN_KEY);
    queuePostLoginBoot();
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

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
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

  return (
    <Box
      id="home"
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #0c120f 0%, #121b15 100%)'
            : 'linear-gradient(180deg, #edf5ef 0%, #f7fbf8 100%)',
      }}
    >
      <AuthTopNav
        activeNavId={activeSection}
        navItems={topNavItems}
        onSelectNav={(id) => setActiveSection(id as AuthSection)}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : { xs: '1fr', md: 'minmax(0, 1.02fr) minmax(420px, 0.98fr)' },
          minHeight: { md: 'calc(100vh - 85px)' },
        }}
      >
        {!isMobile ? (
          <AuthHeroPanel
            activeSlide={activeSlide}
            activeSection={activeSection}
            contactItems={createAuthHeroContactItems(
              CONTACT_EMAIL_ADDRESS,
              CONTACT_PHONE_NUMBER,
              CONTACT_FACEBOOK_URL
            )}
            documentationItems={authHeroDocumentationItems}
            highlights={authHeroDefaultHighlights}
            onNext={handleNextSlide}
            onPrevious={handlePreviousSlide}
            onSelectSlide={setActiveSlide}
            slide={heroSlides[activeSlide]}
            slides={heroSlides}
          />
        ) : null}

        <AuthLoginCard
          activeSection={activeSection}
          authMode={authMode}
          emailAddress={CONTACT_EMAIL_ADDRESS}
          errorMessage={errorMessage}
          facebookUrl={CONTACT_FACEBOOK_URL}
          isSubmitting={isSubmitting}
          isMobileView={isMobile}
          onAuthModeChange={setAuthMode}
          onBackToLogin={handleBackToLogin}
          onShowContact={() => setActiveSection('contact')}
          onLoginSubmit={handleLoginSubmit}
          onRegistrationSuccess={handleRegistrationSuccess}
          password={password}
          phoneNumber={CONTACT_PHONE_NUMBER}
          registrationSuccess={registrationSuccess}
          rememberMe={rememberMe}
          setPassword={setPassword}
          setRememberMe={setRememberMe}
          setShowPassword={setShowPassword}
          setUsername={setUsername}
          showPassword={showPassword}
          username={username}
          versionLabel={process.env.REACT_APP_VERSION || 'v0.1.0-beta'}
        />
      </Box>
    </Box>
  );
};

export default Login;

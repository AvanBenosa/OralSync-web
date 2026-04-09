import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloudQueueRoundedIcon from '@mui/icons-material/CloudQueueRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FunctionComponent, JSX, ReactNode } from 'react';
import { authPalette } from './auth-palette';

type AuthHeroSlideMetric = {
  label: string;
  meta: string;
  value: string;
};

type AuthHeroSlide = {
  badge: string;
  description: string;
  eyebrow: string;
  promoDescription: string;
  promoTag: string;
  promoTitle: string;
  titleAccent: string;
  titlePrimary: string;
  metrics: AuthHeroSlideMetric[];
};

type AuthHeroHighlight = {
  description: string;
  icon: ReactNode;
  title: string;
};

type AuthHeroDocItem = {
  description: string;
  icon: ReactNode;
  title: string;
};

type AuthHeroContactItem = {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
};

type AuthHeroPanelProps = {
  activeSlide: number;
  contactItems: AuthHeroContactItem[];
  documentationItems: AuthHeroDocItem[];
  highlights: AuthHeroHighlight[];
  onNext: () => void;
  onPrevious: () => void;
  onSelectSlide: (index: number) => void;
  activeSection: 'home' | 'documentation' | 'contact';
  slide: AuthHeroSlide;
  slides: AuthHeroSlide[];
};

const AuthHeroPanel: FunctionComponent<AuthHeroPanelProps> = ({
  activeSlide,
  activeSection,
  contactItems,
  documentationItems,
  highlights,
  onNext,
  onPrevious,
  onSelectSlide,
  slide,
  slides,
}): JSX.Element => {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      id="documentation"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, sm: 3.5, lg: 5 },
        py: { xs: 3, sm: 4, md: 5 },
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(165deg, #11291d 0%, #16432e 52%, #226144 100%)'
            : 'linear-gradient(165deg, #133726 0%, #205236 52%, #2b6c49 100%)',
        color: '#ffffff',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top left, rgba(207,255,220,0.16), transparent 32%), radial-gradient(circle at bottom left, rgba(255,255,255,0.1), transparent 18%), radial-gradient(circle at top right, rgba(207,255,220,0.1), transparent 24%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 40, md: 24 },
          right: { xs: -50, md: -40 },
          width: { xs: 140, md: 220 },
          height: { xs: 140, md: 220 },
          borderRadius: '50%',
          border: `1px solid ${alpha('#ffffff', 0.15)}`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: -32,
          width: 120,
          height: 120,
          borderRadius: '40% 60% 55% 45%',
          border: `1px solid ${alpha('#ffffff', 0.18)}`,
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: { xs: 3, md: 4 },
          minHeight: { md: 'calc(100vh - 164px)' },
        }}
      >
        {activeSection === 'home' ? (
          <>
            <Box sx={{ maxWidth: 640 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 42,
                  px: 2.1,
                  mb: 3,
                  borderRadius: 999,
                  border: `1px solid ${alpha('#ffffff', 0.18)}`,
                  backgroundColor: alpha('#ffffff', 0.08),
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8 }}>
                  {slide.badge}
                </Typography>
              </Box>

              <Typography
                sx={{
                  fontSize: { xs: '2.35rem', sm: '3rem', lg: '4.4rem' },
                  fontWeight: 900,
                  lineHeight: 0.96,
                  letterSpacing: -0.05,
                }}
              >
                {slide.titlePrimary}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: { xs: '2.35rem', sm: '3rem', lg: '4.4rem' },
                  fontWeight: 900,
                  lineHeight: 0.96,
                  letterSpacing: -0.05,
                  color: authPalette.light,
                }}
              >
                {slide.titleAccent}
              </Typography>

              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 560,
                  color: alpha('#ffffff', 0.82),
                  fontSize: { xs: 15, sm: 17 },
                  lineHeight: 1.65,
                }}
              >
                {slide.description}
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 3.5 }}
              >
                {highlights.map((item) => (
                  <InfoCard
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.8fr) minmax(240px, 0.7fr)' },
                gap: 2.5,
                p: { xs: 2.2, sm: 2.8, lg: 3 },
                borderRadius: { xs: 4, lg: 5 },
                border: `1px solid ${alpha('#ffffff', 0.13)}`,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.07) 100%)',
                boxShadow: '0 22px 48px rgba(3, 12, 9, 0.26)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: alpha('#ffffff', 0.72), letterSpacing: 1.2, fontWeight: 800 }}
                >
                  {slide.eyebrow}
                </Typography>
                <Typography sx={{ mt: 1, fontSize: { xs: 28, sm: 34 }, fontWeight: 800 }}>
                  {slide.promoTitle}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 420,
                    color: alpha('#ffffff', 0.8),
                    lineHeight: 1.7,
                  }}
                >
                  {slide.promoDescription}
                </Typography>

                <Button
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 3,
                    minHeight: 44,
                    px: 2.2,
                    borderRadius: 999,
                    color: '#ffffff',
                    fontWeight: 800,
                    textTransform: 'none',
                    border: `1px solid ${alpha('#ffffff', 0.16)}`,
                    backgroundColor: alpha('#ffffff', 0.08),
                  }}
                >
                  Explore Features
                </Button>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 1.2,
                  alignContent: 'center',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3.5,
                    border: `1px solid ${alpha('#ffffff', 0.12)}`,
                    backgroundColor: alpha('#0f2018', 0.2),
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: alpha('#ffffff', 0.7), fontWeight: 700 }}>
                    {slide.promoTag}
                  </Typography>
                  <Stack spacing={1.1} sx={{ mt: 1.5 }}>
                    {slide.metrics.map((metric) => (
                      <MetricCard
                        key={metric.label}
                        label={metric.label}
                        meta={metric.meta}
                        value={metric.value}
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1}>
                {slides.map((item, index) => (
                  <Box
                    key={item.promoTitle}
                    onClick={() => onSelectSlide(index)}
                    sx={{
                      width: index === activeSlide ? 28 : 10,
                      height: 10,
                      borderRadius: 999,
                      cursor: 'pointer',
                      transition: 'all 160ms ease',
                      backgroundColor:
                        index === activeSlide ? authPalette.light : alpha('#ffffff', 0.28),
                    }}
                  />
                ))}
              </Stack>

              {!isCompact ? (
                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={onPrevious}
                    sx={navIconButtonSx}
                  >
                    <KeyboardArrowLeftRoundedIcon />
                  </IconButton>
                  <IconButton
                    onClick={onNext}
                    sx={navIconButtonSx}
                  >
                    <KeyboardArrowRightRoundedIcon />
                  </IconButton>
                </Stack>
              ) : null}
            </Box>
          </>
        ) : activeSection === 'documentation' ? (
          <>
            <SectionHeader
              badge="FRONTEND DOCUMENTATION"
              titlePrimary="Built On Existing"
              titleAccent="OralSync Patterns"
              description="This login experience stays aligned with the documented repository rules: React 18 + TypeScript, MUI-first composition, feature-local components, and the existing auth flow."
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              useFlexGap
              flexWrap="wrap"
            >
              {documentationItems.map((item) => (
                <InfoCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </Stack>

            <Box
              sx={sectionPanelSx}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: alpha('#ffffff', 0.72), letterSpacing: 1.2, fontWeight: 800 }}
                >
                  IMPLEMENTATION NOTES
                </Typography>
                <Typography sx={{ mt: 1, fontSize: { xs: 28, sm: 34 }, fontWeight: 800 }}>
                  What changed in this page
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 480,
                    color: alpha('#ffffff', 0.8),
                    lineHeight: 1.7,
                  }}
                >
                  The redesign keeps `loginUser`, `authStore.setSession`, remember-me storage,
                  `queuePostLoginBoot`, and portal routing intact. Only the presentation layer was
                  refactored into smaller auth components.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 1.1,
                }}
              >
                <MetricCard
                  label="Routing"
                  value="PublicRoute"
                  meta="The `/` login entry remains unchanged."
                />
                <MetricCard
                  label="State"
                  value="authStore"
                  meta="Session handling still flows through Zustand."
                />
                <MetricCard
                  label="UI Stack"
                  value="MUI + TS"
                  meta="Consistent with the documented frontend standard."
                />
              </Box>
            </Box>
          </>
        ) : (
          <>
            <SectionHeader
              badge="CONTACT US"
              titlePrimary="Talk To The"
              titleAccent="OralSync Contact Panel"
              description="Use the contact details below for onboarding, demo requests, support concerns, or direct project inquiries."
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              useFlexGap
              flexWrap="wrap"
            >
              {contactItems.map((item) => (
                <ContactCard
                  key={item.label}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Stack>

            <Box sx={sectionPanelSx}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: alpha('#ffffff', 0.72), letterSpacing: 1.2, fontWeight: 800 }}
                >
                  RESPONSE CHANNELS
                </Typography>
                <Typography sx={{ mt: 1, fontSize: { xs: 28, sm: 34 }, fontWeight: 800 }}>
                  Direct contact options
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 460,
                    color: alpha('#ffffff', 0.8),
                    lineHeight: 1.7,
                  }}
                >
                  Email is best for formal requests, phone is best for urgent contact, and Facebook
                  is available for direct profile outreach.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 1.2,
                }}
              >
                <MetricCard
                  label="Email"
                  value="Available"
                  meta="Send onboarding and project inquiries anytime."
                />
                <MetricCard
                  label="Phone"
                  value="PH Mobile"
                  meta="Direct contact number for fast coordination."
                />
                <MetricCard
                  label="Facebook"
                  value="Profile Link"
                  meta="External profile link opens in a new tab."
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

const navIconButtonSx = {
  width: 44,
  height: 44,
  color: '#ffffff',
  border: `1px solid ${alpha('#ffffff', 0.14)}`,
  backgroundColor: alpha('#ffffff', 0.06),
};

const sectionPanelSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.9fr) minmax(240px, 0.68fr)' },
  gap: 2.5,
  p: { xs: 2.2, sm: 2.8, lg: 3 },
  borderRadius: { xs: 4, lg: 5 },
  border: `1px solid ${alpha('#ffffff', 0.13)}`,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.07) 100%)',
  boxShadow: '0 22px 48px rgba(3, 12, 9, 0.26)',
  backdropFilter: 'blur(10px)',
};

const SectionHeader = ({
  badge,
  description,
  titleAccent,
  titlePrimary,
}: {
  badge: string;
  description: string;
  titleAccent: string;
  titlePrimary: string;
}): JSX.Element => (
  <Box sx={{ maxWidth: 700 }}>
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 42,
        px: 2.1,
        mb: 3,
        borderRadius: 999,
        border: `1px solid ${alpha('#ffffff', 0.18)}`,
        backgroundColor: alpha('#ffffff', 0.08),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.8 }}>{badge}</Typography>
    </Box>

    <Typography
      sx={{
        fontSize: { xs: '2.35rem', sm: '3rem', lg: '4.1rem' },
        fontWeight: 900,
        lineHeight: 0.98,
        letterSpacing: -0.05,
      }}
    >
      {titlePrimary}
    </Typography>
    <Typography
      sx={{
        mt: 0.35,
        fontSize: { xs: '2.35rem', sm: '3rem', lg: '4.1rem' },
        fontWeight: 900,
        lineHeight: 0.98,
        letterSpacing: -0.05,
        color: authPalette.light,
      }}
    >
      {titleAccent}
    </Typography>

    <Typography
      sx={{
        mt: 2.5,
        maxWidth: 600,
        color: alpha('#ffffff', 0.82),
        fontSize: { xs: 15, sm: 17 },
        lineHeight: 1.65,
      }}
    >
      {description}
    </Typography>
  </Box>
);

const InfoCard = ({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}): JSX.Element => (
  <Box
    sx={{
      flex: '1 1 190px',
      minWidth: 0,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.4,
      p: 1.5,
      borderRadius: 3.5,
      border: `1px solid ${alpha('#ffffff', 0.12)}`,
      backgroundColor: alpha('#ffffff', 0.06),
      backdropFilter: 'blur(8px)',
    }}
  >
    <Box
      sx={{
        width: 46,
        height: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2.5,
        backgroundColor: alpha('#ffffff', 0.09),
        color: authPalette.light,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box minWidth={0}>
      <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{title}</Typography>
      <Typography sx={{ mt: 0.3, fontSize: 13, color: alpha('#ffffff', 0.74) }}>
        {description}
      </Typography>
    </Box>
  </Box>
);

const ContactCard = ({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
}): JSX.Element => (
  <Box
    component="a"
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noreferrer' : undefined}
    sx={{
      flex: '1 1 220px',
      minWidth: 0,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.4,
      p: 1.6,
      borderRadius: 3.5,
      border: `1px solid ${alpha('#ffffff', 0.12)}`,
      backgroundColor: alpha('#ffffff', 0.06),
      backdropFilter: 'blur(8px)',
      textDecoration: 'none',
      transition: 'transform 140ms ease, border-color 140ms ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        borderColor: alpha('#ffffff', 0.22),
      },
    }}
  >
    <Box
      sx={{
        width: 46,
        height: 46,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2.5,
        backgroundColor: alpha('#ffffff', 0.09),
        color: authPalette.light,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box minWidth={0}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha('#ffffff', 0.72) }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.4, fontSize: 15, fontWeight: 800, color: '#ffffff', overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const MetricCard = ({
  label,
  meta,
  value,
}: {
  label: string;
  meta: string;
  value: string;
}): JSX.Element => (
  <Box
    sx={{
      p: 1.4,
      borderRadius: 3,
      backgroundColor: alpha('#ffffff', 0.08),
      border: `1px solid ${alpha('#ffffff', 0.08)}`,
    }}
  >
    <Typography sx={{ fontSize: 12, color: alpha('#ffffff', 0.72) }}>{label}</Typography>
    <Typography sx={{ mt: 0.4, fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
    <Typography sx={{ mt: 0.5, fontSize: 12, color: authPalette.light }}>{meta}</Typography>
  </Box>
);

export const authHeroDefaultHighlights = [
  {
    title: 'Secure & Compliant',
    description: 'Protected workflows for clinic records and daily staff use.',
    icon: <SecurityRoundedIcon fontSize="small" />,
  },
  {
    title: 'Smart Insights',
    description: 'Fast visibility into appointments, billing, and patient movement.',
    icon: <InsightsRoundedIcon fontSize="small" />,
  },
  {
    title: 'Always Accessible',
    description: 'Cloud-based access built for front desk and chairside teams.',
    icon: <CloudQueueRoundedIcon fontSize="small" />,
  },
];

export const authHeroDocumentationItems = [
  {
    title: 'Feature-Based Modules',
    description: 'The page stays inside `src/features/login/` and follows the current feature structure.',
    icon: <DescriptionRoundedIcon fontSize="small" />,
  },
  {
    title: 'Public Auth Routing',
    description: 'The login screen remains the `/` entry under `PublicRoute` with no auth flow changes.',
    icon: <RouteRoundedIcon fontSize="small" />,
  },
  {
    title: 'MUI + Existing Palette',
    description: 'The redesign keeps the current MUI composition and the existing green auth palette.',
    icon: <InsightsRoundedIcon fontSize="small" />,
  },
];

export const createAuthHeroContactItems = (
  emailAddress: string,
  phoneNumber: string,
  facebookUrl: string
) => [
  {
    label: 'Email Address',
    value: emailAddress,
    href: `mailto:${emailAddress}`,
    icon: <EmailRoundedIcon fontSize="small" />,
  },
  {
    label: 'Contact Number',
    value: phoneNumber,
    href: 'tel:+639765628426',
    icon: <PhoneRoundedIcon fontSize="small" />,
  },
  {
    label: 'Facebook Page',
    value: 'Open Facebook Profile',
    href: facebookUrl,
    icon: <FacebookRoundedIcon fontSize="small" />,
  },
];

export type { AuthHeroSlide };

export default AuthHeroPanel;

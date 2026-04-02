import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

const POST_LOGIN_BOOT_KEY = 'dmd-post-login-boot';
const POST_LOGIN_BOOT_DURATION_MS = 1600;
const STEP_ADVANCE_MS = 420;

const bootSteps = [
  'Securing your clinic session',
  'Preparing dashboard modules',
  "Syncing today's workspace",
] as const;

export const queuePostLoginBoot = (): void => {
  window.sessionStorage.setItem(POST_LOGIN_BOOT_KEY, '1');
};

export const usePostLoginBoot = (): boolean => {
  const [showBootScreen, setShowBootScreen] = useState<boolean>(
    () => window.sessionStorage.getItem(POST_LOGIN_BOOT_KEY) === '1'
  );

  useEffect(() => {
    if (!showBootScreen) {
      return;
    }

    window.sessionStorage.removeItem(POST_LOGIN_BOOT_KEY);

    const timeout = window.setTimeout(() => {
      setShowBootScreen(false);
    }, POST_LOGIN_BOOT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [showBootScreen]);

  return showBootScreen;
};

type PostLoginBootScreenProps = {
  clinicName?: string | null;
  portalLabel?: string;
};

const PostLoginBootScreen: FunctionComponent<PostLoginBootScreenProps> = ({
  clinicName,
  portalLabel = 'Clinic workspace',
}): JSX.Element => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStepIndex((currentIndex) =>
        currentIndex >= bootSteps.length - 1 ? currentIndex : currentIndex + 1
      );
    }, STEP_ADVANCE_MS);

    return () => window.clearInterval(interval);
  }, []);

  const helperText = useMemo(() => {
    const normalizedClinicName = clinicName?.trim();

    if (!normalizedClinicName) {
      return 'Modules are setting up. Please wait a moment.';
    }

    return `Modules are setting up for ${normalizedClinicName}. Please wait a moment.`;
  }, [clinicName]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2.5,
        py: 4,
        background:
          'radial-gradient(circle at top left, rgba(207,255,220,0.28), transparent 24%), radial-gradient(circle at bottom right, rgba(104,186,127,0.18), transparent 28%), linear-gradient(145deg, #eef7f0 0%, #f7fbf8 48%, #eef7f0 100%)',
      }}
    >
      <Box
        sx={{
          width: 'min(100%, 560px)',
          borderRadius: 5,
          p: { xs: 3, sm: 4 },
          border: '1px solid rgba(46, 111, 64, 0.12)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,250,244,0.96) 100%)',
          boxShadow: '0 30px 70px rgba(37, 61, 44, 0.14)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Stack spacing={2.25}>
          <Chip
            icon={<AutoAwesomeRoundedIcon sx={{ color: '#2E6F40 !important' }} />}
            label={portalLabel}
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 700,
              color: '#2E6F40',
              backgroundColor: 'rgba(207, 255, 220, 0.6)',
              border: '1px solid rgba(46, 111, 64, 0.12)',
            }}
          />

          <Box
            component="img"
            src="/OralSync.png"
            alt="OralSync logo"
            sx={{
              width: { xs: 180, sm: 220 },
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 30px rgba(37, 61, 44, 0.12))',
            }}
          />

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#20352A',
                fontSize: { xs: '1.7rem', sm: '2.15rem' },
                lineHeight: 1.08,
              }}
            >
              Preparing your workspace
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                maxWidth: 460,
                color: '#587063',
                lineHeight: 1.65,
              }}
            >
              {helperText}
            </Typography>
          </Box>

          <Stack spacing={1}>
            {bootSteps.map((step, index) => {
              const isActive = index <= activeStepIndex;

              return (
                <Box
                  key={step}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.4,
                    py: 1.1,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(46, 111, 64, 0.18)' : 'rgba(46, 111, 64, 0.08)',
                    bgcolor: isActive ? 'rgba(207, 255, 220, 0.5)' : 'rgba(255, 255, 255, 0.72)',
                    transition: 'all 180ms ease',
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: isActive ? '#2E6F40' : 'rgba(46, 111, 64, 0.18)',
                      boxShadow: isActive ? '0 0 0 5px rgba(104, 186, 127, 0.18)' : 'none',
                      transition: 'all 180ms ease',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#20352A' : '#6d8278',
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          <Box>
            <LinearProgress
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: 'rgba(46, 111, 64, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #68BA7F 0%, #2E6F40 100%)',
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: '#6d8278',
                letterSpacing: 0.2,
              }}
            >
              Modules are setting up. Please wait...
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default PostLoginBootScreen;

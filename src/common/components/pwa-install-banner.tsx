import { FunctionComponent, JSX, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import SmartPhoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import usePwaInstall from '../hooks/use-pwa-install';
import { useAuthStore } from '../store/authStore';

const PwaInstallBanner: FunctionComponent = (): JSX.Element | null => {
  const { canPromptInstall, isManualIosInstall, shouldShowBanner, dismissBanner, promptInstall } =
    usePwaInstall();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isLoggedIn || !shouldShowBanner) {
    return null;
  }

  const handleInstall = async (): Promise<void> => {
    if (!canPromptInstall || isInstalling) {
      return;
    }

    setIsInstalling(true);

    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Fade in={shouldShowBanner}>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 132, sm: 24 },
          zIndex: (theme) => theme.zIndex.snackbar + 2,
          width: { xs: 'calc(100vw - 32px)', sm: 396 },
          maxWidth: 'calc(100vw - 32px)',
          overflow: 'hidden',
          borderRadius: '20px',
          border: '1px solid rgba(140, 185, 151, 0.22)',
          background:
            'linear-gradient(135deg, rgba(33,88,55,0.98) 0%, rgba(24,61,38,0.98) 100%)',
          boxShadow: '0 24px 42px rgba(13, 42, 25, 0.24)',
          color: '#f5fff7',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.75,
            background:
              'radial-gradient(circle at top right, rgba(121,214,145,0.28), transparent 38%)',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <Box
              sx={{
                mt: 0.2,
                width: 42,
                height: 42,
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(230, 255, 236, 0.14)',
                border: '1px solid rgba(207,255,220,0.18)',
                flex: '0 0 auto',
              }}
            >
              {isManualIosInstall ? (
                <SmartPhoneRoundedIcon sx={{ color: '#dfffe8' }} />
              ) : (
                <DownloadRoundedIcon sx={{ color: '#dfffe8' }} />
              )}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.25 }}>
                  Install OralSync
                </Typography>
                <IconButton
                  size="small"
                  onClick={dismissBanner}
                  aria-label="Dismiss install banner"
                  sx={{ color: 'rgba(236,255,241,0.88)', mt: -0.45, mr: -0.5 }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Typography
                sx={{
                  mt: 0.55,
                  color: 'rgba(232,255,237,0.82)',
                  fontSize: '0.82rem',
                  lineHeight: 1.55,
                }}
              >
                {isManualIosInstall
                  ? 'On iPhone or iPad, use Safari Share'
                  : 'Launch OralSync like an app with faster reopen time and a cleaner clinic workspace.'}
                {isManualIosInstall ? (
                  <>
                    {' '}
                    <IosShareRoundedIcon sx={{ fontSize: 15, verticalAlign: 'text-bottom', mx: 0.3 }} />
                    {' '}
                    then choose <strong>Add to Home Screen</strong>.
                  </>
                ) : null}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                {canPromptInstall ? (
                  <Button
                    variant="contained"
                    onClick={() => void handleInstall()}
                    disabled={isInstalling}
                    startIcon={
                      isInstalling ? <CircularProgress size={14} color="inherit" /> : <DownloadRoundedIcon />
                    }
                    sx={{
                      minWidth: 154,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: '#eefaf0',
                      color: '#184125',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#ffffff',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {isInstalling ? 'Installing...' : 'Install OralSync'}
                  </Button>
                ) : null}

                <Button
                  variant="text"
                  onClick={dismissBanner}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    color: 'rgba(238,250,240,0.9)',
                  }}
                >
                  {isManualIosInstall ? 'Got it' : 'Later'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Fade>
  );
};

export default PwaInstallBanner;

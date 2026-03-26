import { FunctionComponent, JSX } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { authPalette, authPrimaryGradient, authSurfaceGradient } from './auth-palette';

type RegistrationSuccessPanelProps = {
  clinicName?: string;
  userName?: string;
  onBackToLogin: () => void;
};

const RegistrationSuccessPanel: FunctionComponent<RegistrationSuccessPanelProps> = ({
  clinicName,
  userName,
  onBackToLogin,
}): JSX.Element => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 3, sm: 4 },
      borderRadius: 4,
      border: `1px solid ${authPalette.border}`,
      background: authSurfaceGradient,
      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      textAlign: 'center',
    }}
  >
    <Box
      sx={{
        width: 72,
        height: 72,
        mx: 'auto',
        mb: 2,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: 34,
        fontWeight: 800,
        color: authPalette.primary,
        background: 'linear-gradient(135deg, rgba(104, 186, 127, 0.18), rgba(207, 255, 220, 0.08))',
      }}
    >
      OK
    </Box>

    <Typography
      variant="overline"
      sx={{ color: authPalette.primary, fontWeight: 800, letterSpacing: 2 }}
    >
      Registration Complete
    </Typography>
    <Typography variant="h5" sx={{ mt: 1, fontWeight: 800, color: authPalette.text }}>
      Thank you for registering with OralSync DMS
    </Typography>
    <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary' }}>
      Your clinic account has been created successfully. Please return to the login page and sign in
      with your new credentials.
    </Typography>
    {clinicName ? (
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Clinic: <strong>{clinicName}</strong>
      </Typography>
    ) : null}
    {userName ? (
      <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
        Username: <strong>{userName}</strong>
      </Typography>
    ) : null}

    <Button
      variant="contained"
      fullWidth
      onClick={onBackToLogin}
      sx={{
        mt: 3,
        py: 1.2,
        borderRadius: 2.5,
        fontWeight: 800,
        background: authPrimaryGradient,
        boxShadow: authPalette.buttonShadow,
        '&:hover': {
          background: authPrimaryGradient,
          boxShadow: authPalette.buttonShadow,
        },
      }}
    >
      Go To Login
    </Button>
  </Paper>
);

export default RegistrationSuccessPanel;

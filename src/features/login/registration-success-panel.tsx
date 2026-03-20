import { FunctionComponent, JSX } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';

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
      border: '1px solid rgba(19, 71, 107, 0.1)',
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(242,248,252,0.96) 100%)',
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
        color: '#1677a8',
        background: 'linear-gradient(135deg, rgba(22, 119, 168, 0.16), rgba(22, 119, 168, 0.06))',
      }}
    >
      OK
    </Box>

    <Typography variant="overline" sx={{ color: '#1677a8', fontWeight: 800, letterSpacing: 2 }}>
      Registration Complete
    </Typography>
    <Typography variant="h5" sx={{ mt: 1, fontWeight: 800, color: '#183b56' }}>
      Thank you for registering with DMD
    </Typography>
    <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary' }}>
      Your clinic account has been created successfully. Please return to the login page and sign
      in with your new credentials.
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
        boxShadow: '0 14px 30px rgba(22, 119, 168, 0.22)',
      }}
    >
      Go To Login
    </Button>
  </Paper>
);

export default RegistrationSuccessPanel;

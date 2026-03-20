import { FunctionComponent, JSX } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

type ClinicLockedDialogProps = {
  open: boolean;
  clinicName?: string;
  onLogout: () => void;
};

const ClinicLockedDialog: FunctionComponent<ClinicLockedDialogProps> = ({
  open,
  clinicName,
  onLogout,
}): JSX.Element => {
  return (
    <Dialog open={open} fullWidth maxWidth="sm" disableEscapeKeyDown>
      <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#183b56' }}>
        Clinic Account Locked
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(210, 51, 75, 0.1)',
              color: '#c62828',
              flexShrink: 0,
            }}
          >
            <LockRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1" sx={{ color: '#183b56', fontWeight: 700, mb: 1 }}>
              {clinicName
                ? `${clinicName} is currently locked.`
                : 'This clinic account is currently locked.'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Access to DMD has been restricted for this clinic.
            </Typography>
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              Payment is required before the clinic account can be reactivated.
            </Alert>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Please contact me to settle the payment and unlock the clinic account.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" color="error" onClick={onLogout}>
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClinicLockedDialog;

import { FunctionComponent, JSX, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@mui/material';

type DataPrivacyConsentDialogProps = {
  open: boolean;
  clinicName?: string;
  isSubmitting: boolean;
  submitError: string;
  onAccept: () => Promise<void>;
};

const DataPrivacyConsentDialog: FunctionComponent<DataPrivacyConsentDialogProps> = ({
  open,
  clinicName,
  isSubmitting,
  submitError,
  onAccept,
}): JSX.Element => {
  const [isChecked, setIsChecked] = useState(false);

  const handleAccept = async (): Promise<void> => {
    if (!isChecked || isSubmitting) {
      return;
    }

    await onAccept();
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" disableEscapeKeyDown>
      <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#183b56' }}>
        Data Privacy Act Consent
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {clinicName
            ? `${clinicName} must accept the data privacy consent before using DMD.`
            : 'Your clinic must accept the data privacy consent before using DMD.'}
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid rgba(19, 71, 107, 0.12)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,248,252,0.96) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#183b56', mb: 1 }}>
            Republic Act No. 10173, Data Privacy Act of 2012
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            By continuing, your clinic confirms that it will collect, encode, store, and process
            patient and staff information only for legitimate healthcare and operational purposes
            inside DMD.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic agrees to keep personal and medical information confidential, limit access
            to authorized personnel, maintain accurate records, and protect data against
            unauthorized disclosure, alteration, or loss.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic also confirms that patients and staff will be informed about how their data
            is used, and that requests related to correction, access, or lawful disclosure will be
            handled in accordance with your privacy obligations and internal procedures.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Acceptance is recorded once per clinic and will not be requested again for future
            logins after it has been approved.
          </Typography>
        </Box>

        <FormControlLabel
          sx={{ mt: 2, alignItems: 'flex-start' }}
          control={
            <Checkbox
              checked={isChecked}
              onChange={(event) => setIsChecked(event.target.checked)}
              sx={{ mt: -0.5 }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              I confirm that this clinic accepts the DMD data privacy consent and will comply with
              applicable privacy requirements.
            </Typography>
          }
        />

        {submitError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={() => void handleAccept()}
          disabled={!isChecked || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Accept And Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DataPrivacyConsentDialog;

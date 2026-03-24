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

type BetaTestingDialogProps = {
  open: boolean;
  clinicName?: string;
  isSubmitting: boolean;
  submitError: string;
  onAccept: () => Promise<void>;
};

const BetaTestingDialog: FunctionComponent<BetaTestingDialogProps> = ({
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
        Beta Testing Program Participation
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {clinicName
            ? `${clinicName} must accept the beta testing terms before using OralSync.`
            : 'Your clinic must accept the beta testing terms before using OralSync.'}
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
            OralSync Beta Testing Agreement
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            By continuing, your clinic acknowledges that you are participating in the OralSync beta
            testing program. This means the system may contain new features, updates, and changes
            that are still in development and testing phases.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic agrees to provide feedback on system performance, report any issues
            encountered, and assist in identifying areas for improvement. Beta features may be
            subject to changes, modifications, or removal based on testing results and feedback.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic understands that beta testing may expose the system to potential
            instabilities, data inconsistencies, or unexpected behavior. Your clinic accepts
            responsibility for maintaining backups and acknowledges the inherent risks of using
            pre-release software.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Acceptance is recorded once per clinic and will not be requested again after it has been
            approved.
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
              I confirm that this clinic accepts the OralSync beta testing agreement and understands
              the terms and conditions of participating in the beta program.
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

export default BetaTestingDialog;

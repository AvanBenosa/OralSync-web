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

type ContractPolicyDialogProps = {
  open: boolean;
  clinicName?: string;
  isSubmitting: boolean;
  submitError: string;
  onAccept: () => Promise<void>;
};

const ContractPolicyDialog: FunctionComponent<ContractPolicyDialogProps> = ({
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
        Contract Policy Acceptance
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {clinicName
            ? `${clinicName} must accept the contract policy before using OralSync.`
            : 'Your clinic must accept the contract policy before using OralSync.'}
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
            OralSync Service Contract and Terms of Agreement
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            By continuing, your clinic confirms that it has reviewed and agrees to the terms and
            conditions of the OralSync service contract. Your clinic accepts all responsibilities
            outlined in the service agreement.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic agrees to comply with all applicable regulations, maintain system security,
            and use OralSync solely for legitimate dental practice purposes. Your clinic is
            responsible for ensuring authorized personnel access and maintaining compliance with
            contractual obligations.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            Your clinic acknowledges that any breach of this contract may result in service
            suspension or termination. The terms of this agreement will remain in effect for the
            duration of your clinic's subscription and use of OralSync.
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
              I confirm that this clinic has read and accepts the OralSync contract policy and
              agrees to comply with all terms and conditions.
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

export default ContractPolicyDialog;

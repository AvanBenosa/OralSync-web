import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import { useAuthStore } from '../../common/store/authStore';
import { CheckoutView } from '../subscription/components/CheckoutView';
import { PlanSelector } from '../subscription/components/PlanSelector';
import { PollingView } from '../subscription/components/PollingView';
import { SuccessView } from '../subscription/components/SuccessView';
import { syncPaidTransactionToUser } from '../subscription/api/session';
import type { SubscriptionStateModel } from '../subscription/api/types';
import {
  ManualPaymentMethod,
  PaymentChannel,
  SubscriptionMonths,
} from '../subscription/api/types';

type ClinicLockedDialogProps = {
  open: boolean;
  clinicName?: string;
  onLogout: () => void;
};

const PAYMENT_STEPS = ['Choose Plan', 'Payment', 'Confirm', 'Done'];

const createInitialPaymentState = (): SubscriptionStateModel => ({
  step: 'plans',
  selectedPlan: null,
  selectedMonths: 1 as SubscriptionMonths,
  paymentChannel: PaymentChannel.PayMongo,
  manualPayment: {
    paymentMethod: ManualPaymentMethod.GCash,
    senderName: '',
    referenceNumber: '',
    proofImageUrl: '',
    proofFileName: '',
  },
  transaction: null,
  isSubmitting: false,
  isUploadingProof: false,
  pollCount: 0,
  errorMessage: null,
});

const stepFromState = (step: SubscriptionStateModel['step']): number => {
  const map: Record<SubscriptionStateModel['step'], number> = {
    plans: 0,
    checkout: 1,
    polling: 2,
    success: 3,
  };

  return map[step];
};

const ClinicLockedDialog: FunctionComponent<ClinicLockedDialogProps> = ({
  open,
  clinicName,
  onLogout,
}): JSX.Element => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [paymentState, setPaymentState] = useState<SubscriptionStateModel>(createInitialPaymentState);

  useEffect(() => {
    if (!open) {
      setShowPaymentFlow(false);
      setPaymentState(createInitialPaymentState());
    }
  }, [open]);

  const handleStartPayment = (): void => {
    setShowPaymentFlow(true);
    setPaymentState(createInitialPaymentState());
  };

  const handleBackToLockNotice = (): void => {
    setShowPaymentFlow(false);
    setPaymentState(createInitialPaymentState());
  };

  const handlePaymentSuccess = async (): Promise<void> => {
    updateUser(await syncPaidTransactionToUser(user, paymentState.transaction));
    setShowPaymentFlow(false);
    setPaymentState(createInitialPaymentState());
  };

  return (
    <Dialog open={open} fullWidth maxWidth={showPaymentFlow ? 'md' : 'sm'} disableEscapeKeyDown>
      <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#183b56' }}>
        {showPaymentFlow ? 'Unlock Clinic Workspace' : 'Clinic Account Locked'}
      </DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        {!showPaymentFlow ? (
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
                Access to OralSync DMS has been restricted for this clinic until the subscription
                payment is settled.
              </Typography>
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                Pay via PayMongo for instant confirmation, or submit a manual payment proof to
                unlock access right away while verification is pending.
              </Alert>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                You can settle the subscription here and resume using the system right away.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Complete the subscription payment below. PayMongo confirms automatically, while
              manual payment submission restores access immediately and stays pending for review.
            </Alert>

            <Stepper activeStep={stepFromState(paymentState.step)} alternativeLabel sx={{ mb: 4 }}>
              {PAYMENT_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {paymentState.step === 'plans' && (
              <PlanSelector
                state={paymentState}
                setState={setPaymentState}
                currentPlan={user?.subscriptionType}
              />
            )}

            {paymentState.step === 'checkout' && (
              <CheckoutView state={paymentState} setState={setPaymentState} />
            )}

            {paymentState.step === 'polling' && (
              <PollingView state={paymentState} setState={setPaymentState} />
            )}

            {paymentState.step === 'success' && (
              <SuccessView
                state={paymentState}
                onDone={handlePaymentSuccess}
                doneLabel="Continue to Workspace"
              />
            )}
          </Box>
        )}
      </DialogContent>
      {!showPaymentFlow ? (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" color="error" onClick={onLogout}>
            Logout
          </Button>
          <Button
            variant="contained"
            startIcon={<CreditCardRoundedIcon />}
            onClick={handleStartPayment}
          >
            Pay Subscription
          </Button>
        </DialogActions>
      ) : paymentState.step !== 'success' ? (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleBackToLockNotice} disabled={paymentState.isSubmitting}>
            Back
          </Button>
          <Button variant="contained" color="error" onClick={onLogout}>
            Logout
          </Button>
        </DialogActions>
      ) : null}
    </Dialog>
  );
};

export default ClinicLockedDialog;

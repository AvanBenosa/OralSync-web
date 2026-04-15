import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import { useAuthStore } from '../../common/store/authStore';
import {
  formatSubscriptionValidityDate,
  getSubscriptionDaysRemaining,
  isPendingClinicStatus,
} from '../../common/utils/subscription';
import { getManualPaymentStatus } from '../subscription/api/api';
import { CheckoutView } from '../subscription/components/CheckoutView';
import { PlanSelector } from '../subscription/components/PlanSelector';
import { PollingView } from '../subscription/components/PollingView';
import { SuccessView } from '../subscription/components/SuccessView';
import { syncPaidTransactionToUser } from '../subscription/api/session';
import type { SubscriptionStateModel } from '../subscription/api/types';
import {
  DEFAULT_SUBSCRIPTION_MONTHS,
  ManualPaymentMethod,
  PaymentChannel,
  PaymentStatus,
} from '../subscription/api/types';

type ClinicLockedDialogProps = {
  open: boolean;
  clinicName?: string;
  trialExpiry?: string;
  isStartingTrial?: boolean;
  onLogout: () => void;
  onTrial: () => void;
};

const PAYMENT_STEPS = ['Choose Plan', 'Payment', 'Confirm', 'Done'];
const ACTIVATION_CONTACT = {
  phone: '+63 976 562 8426',
  email: 'evanbenosa045@gmail.com',
};

const createInitialPaymentState = (): SubscriptionStateModel => ({
  step: 'plans',
  selectedPlan: null,
  selectedMonths: DEFAULT_SUBSCRIPTION_MONTHS,
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
  trialExpiry,
  isStartingTrial = false,
  onLogout,
  onTrial,
}): JSX.Element => {
  const trialDaysRemaining = getSubscriptionDaysRemaining(trialExpiry);
  const isTrialActive = trialDaysRemaining !== null && trialDaysRemaining >= 0;
  const isTrialExpired = trialDaysRemaining !== null && trialDaysRemaining < 0;
  const formattedTrialExpiryDate = formatSubscriptionValidityDate(trialExpiry);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [hasSubmittedPendingManualPayment, setHasSubmittedPendingManualPayment] = useState(false);
  const [isCheckingSubmittedPayment, setIsCheckingSubmittedPayment] = useState(false);
  const [paymentState, setPaymentState] =
    useState<SubscriptionStateModel>(createInitialPaymentState);
  const isPendingManualPayment =
    paymentState.transaction?.paymentChannel === PaymentChannel.Manual &&
    paymentState.transaction?.status === PaymentStatus.Pending;
  const isPendingActivation =
    isPendingClinicStatus(user?.status) || hasSubmittedPendingManualPayment;

  useEffect(() => {
    if (!open) {
      setShowPaymentFlow(false);
      setHasSubmittedPendingManualPayment(false);
      setIsCheckingSubmittedPayment(false);
      setPaymentState(createInitialPaymentState());
    }
  }, [open]);

  const handleStartPayment = async (): Promise<void> => {
    if (isPendingActivation) {
      setIsCheckingSubmittedPayment(true);

      try {
        const latestManualPayment = await getManualPaymentStatus();
        const latestStatus = String(latestManualPayment?.status ?? '')
          .trim()
          .toLowerCase();

        if (latestStatus === PaymentStatus.Pending.toLowerCase()) {
          setShowPaymentFlow(true);
          setPaymentState({
            ...createInitialPaymentState(),
            step: 'success',
            transaction: latestManualPayment,
          });
          return;
        }
      } catch {
        // Fall back to the regular payment flow if the latest submitted payment cannot be loaded.
      } finally {
        setIsCheckingSubmittedPayment(false);
      }
    }

    setShowPaymentFlow(true);
    setPaymentState(createInitialPaymentState());
  };

  const handleBackToLockNotice = (): void => {
    setShowPaymentFlow(false);
    setPaymentState(createInitialPaymentState());
  };

  const handlePaymentSuccess = async (): Promise<void> => {
    const transaction = paymentState.transaction;
    const hasPendingManualPayment =
      transaction?.paymentChannel === PaymentChannel.Manual &&
      transaction?.status === PaymentStatus.Pending;

    setHasSubmittedPendingManualPayment(hasPendingManualPayment);
    updateUser(await syncPaidTransactionToUser(user, transaction));
    setShowPaymentFlow(false);
    setPaymentState(
      hasPendingManualPayment
        ? {
            ...createInitialPaymentState(),
            transaction,
          }
        : createInitialPaymentState()
    );
  };

  const activationFollowUpContent = (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Please wait while we confirm your payment and activate the account. If activation is urgent,
        contact:
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1 }}>
        <Typography variant="body2">
          <Box component="span" sx={{ fontWeight: 700 }}>
            Phone:
          </Box>{' '}
          <Link href={`tel:${ACTIVATION_CONTACT.phone}`} underline="hover">
            {ACTIVATION_CONTACT.phone}
          </Link>
        </Typography>
        <Typography variant="body2">
          <Box component="span" sx={{ fontWeight: 700 }}>
            Email:
          </Box>{' '}
          <Link href={`mailto:${ACTIVATION_CONTACT.email}`} underline="hover">
            {ACTIVATION_CONTACT.email}
          </Link>
        </Typography>
      </Stack>
      <Typography variant="body2">
        Share your clinic name and payment reference number so the account can be activated faster.
      </Typography>
    </Box>
  );

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
              {isPendingActivation ? (
                <>
                  <Typography variant="body1" sx={{ color: '#183b56', fontWeight: 700, mb: 1 }}>
                    {clinicName
                      ? `Payment for ${clinicName} has already been submitted.`
                      : 'Payment for this clinic has already been submitted.'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                    The clinic account will stay locked while the submitted payment is being
                    reviewed for activation.
                  </Typography>
                  <Alert severity="info" sx={{ mb: 1.5 }}>
                    Please wait while we validate the payment. If activation is urgent, use the
                    contact details below for faster follow-up.
                  </Alert>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      mb: 1.5,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#183b56', mb: 1 }}>
                      Activation Follow-up
                    </Typography>
                    {activationFollowUpContent}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Access resumes once the payment is confirmed as paid.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body1" sx={{ color: '#183b56', fontWeight: 700, mb: 1 }}>
                    {clinicName
                      ? `${clinicName} is currently locked.`
                      : 'This clinic account is currently locked.'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                    Access to OralSync DMS has been restricted for this clinic until the
                    subscription payment is settled.
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    Pay via PayMongo for instant confirmation, or submit a manual payment proof for
                    admin review. Manual payments stay pending until the status is marked as paid.
                  </Alert>
                  {isTrialActive && (
                    <Alert severity="info" sx={{ mb: 1.5 }}>
                      Your 3-day trial is active until{' '}
                      <strong>{formattedTrialExpiryDate}</strong>. You can try the
                      system for free until then.
                    </Alert>
                  )}
                  {isTrialExpired && (
                    <Alert severity="error" sx={{ mb: 1.5 }}>
                      Your free trial has expired. Please subscribe to continue.
                    </Alert>
                  )}
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    You can settle the subscription here. Access resumes once a payment is confirmed
                    as paid.
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Complete the subscription payment below. PayMongo confirms automatically, while manual
              payment stays pending until an admin validates it as paid.
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
                pendingManualPaymentInfo={activationFollowUpContent}
                doneLabel={isPendingManualPayment ? 'Back to Lock Notice' : 'Continue to Workspace'}
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
          {isTrialActive && (
            <Button
              variant="outlined"
              color="success"
              onClick={onTrial}
              disabled={isStartingTrial}
            >
              {isStartingTrial ? 'Starting Trial...' : 'Try Trial'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<CreditCardRoundedIcon />}
            onClick={() => void handleStartPayment()}
            disabled={isCheckingSubmittedPayment}
          >
            {isCheckingSubmittedPayment
              ? 'Checking Payment...'
              : isPendingActivation
              ? "I've Already Paid"
              : 'Pay Subscription'}
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

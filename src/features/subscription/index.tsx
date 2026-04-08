import { FunctionComponent, JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Step, StepLabel, Stepper } from '@mui/material';
import { useAuthStore } from '../../common/store/authStore';
import { CheckoutView } from './components/CheckoutView';
import { PlanSelector } from './components/PlanSelector';
import { PollingView } from './components/PollingView';
import { SuccessView } from './components/SuccessView';
import type { SubscriptionStateModel } from './api/types';
import { ManualPaymentMethod, PaymentChannel, SubscriptionMonths } from './api/types';
import { syncSubscriptionTransactionToUser } from './api/session';

export type SubscriptionModuleProps = {
  clinicId?: string;
};

const STEPS = ['Choose Plan', 'Payment', 'Confirm', 'Done'];

const stepFromState = (step: SubscriptionStateModel['step']): number => {
  const map: Record<SubscriptionStateModel['step'], number> = {
    plans: 0,
    checkout: 1,
    polling: 2,
    success: 3,
  };
  return map[step];
};

const createInitialState = (): SubscriptionStateModel => ({
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

const SubscriptionModule: FunctionComponent<SubscriptionModuleProps> = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [state, setState] = useState<SubscriptionStateModel>(createInitialState);

  const handleDone = async () => {
    updateUser(await syncSubscriptionTransactionToUser(user, state.transaction));
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stepper activeStep={stepFromState(state.step)} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        {state.step === 'plans' && (
          <PlanSelector state={state} setState={setState} currentPlan={user?.subscriptionType} />
        )}

        {state.step === 'checkout' && <CheckoutView state={state} setState={setState} />}

        {state.step === 'polling' && <PollingView state={state} setState={setState} />}

        {state.step === 'success' && <SuccessView state={state} onDone={handleDone} />}
      </Paper>

      <Box textAlign="center" mt={2}>
        <Box
          component="span"
          sx={{
            fontSize: 11,
            color: 'text.disabled',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          PayMongo or Manual Payment - PH
        </Box>
      </Box>
    </Container>
  );
};

export default SubscriptionModule;

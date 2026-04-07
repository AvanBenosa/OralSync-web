import { FunctionComponent, JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Step, StepLabel, Stepper } from '@mui/material';
import { useAuthStore } from '../../common/store/authStore';
import { CheckoutView } from './components/CheckoutView';
import { PlanSelector } from './components/PlanSelector';
import { PollingView } from './components/PollingView';
import { SuccessView } from './components/SuccessView';
import type { SubscriptionStateModel } from './api/types';
import { SubscriptionMonths, SubscriptionPlan } from './api/types';

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

const SubscriptionModule: FunctionComponent<SubscriptionModuleProps> = (): JSX.Element => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [state, setState] = useState<SubscriptionStateModel>({
    step: 'plans',
    selectedPlan: null,
    selectedMonths: 1 as SubscriptionMonths,
    transaction: null,
    isSubmitting: false,
    pollCount: 0,
  });

  const handleDone = () => {
    // Push the new plan + new validityDate into authStore immediately.
    // This makes getSubscriptionDaysRemaining() re-evaluate on the dashboard
    // so the subscription warning banner disappears right away.
    if (user && state.transaction) {
      const { subscriptionType, subscriptionMonths, paidAt } = state.transaction;

      // Calculate the new validity date from the paid date + subscriptionMonths.
      // Mirror the backend logic: extend from existing validity if still future,
      // otherwise extend from paidAt.
      let baseDate = new Date(paidAt ?? Date.now());
      const currentValidity = user.validityDate ? new Date(user.validityDate) : null;
      if (currentValidity && currentValidity > baseDate) {
        baseDate = currentValidity;
      }
      baseDate.setMonth(baseDate.getMonth() + (subscriptionMonths ?? 1));
      const newValidityDate = baseDate.toISOString();

      updateUser({
        ...user,
        subscriptionType: (subscriptionType as string) ?? user.subscriptionType,
        validityDate: newValidityDate,
        isLocked: false,
      });
    }
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Stepper */}
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

      {/* Powered by PayMongo badge */}
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
          Secured by PayMongo · GCash · PH
        </Box>
      </Box>
    </Container>
  );
};

export default SubscriptionModule;

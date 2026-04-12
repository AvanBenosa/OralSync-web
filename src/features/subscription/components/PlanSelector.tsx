import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { FunctionComponent, JSX, MouseEvent } from 'react';
import {
  formatCurrency,
  getPrice,
  MONTHS_LABEL,
  PLAN_FEATURES,
  SUBSCRIPTION_VISIBLE_MONTHS_OPTIONS,
  SubscriptionMonths,
  SubscriptionPlan,
  SubscriptionStateModel,
} from '../api/types';

type Props = {
  state: SubscriptionStateModel;
  setState: Function;
  currentPlan?: string;
};

const ALL_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.Basic,
  SubscriptionPlan.Standard,
  SubscriptionPlan.Premium,
];

const FEATURE_INCLUDED: Record<SubscriptionPlan, boolean[]> = {
  [SubscriptionPlan.Basic]: [true, true, true, false, false, false],
  [SubscriptionPlan.Standard]: [true, true, true, true, true, true],
  [SubscriptionPlan.Premium]: [true, true, true, true, true, true, true],
};

const PLAN_TAGLINE: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]: 'Starter clinic plan',
  [SubscriptionPlan.Standard]: 'Balanced everyday plan',
  [SubscriptionPlan.Premium]: 'Expanded multi-branch plan',
};

const PLAN_DESCRIPTION: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]:
    'Best for solo or startup clinics handling a lighter daily patient load.',
  [SubscriptionPlan.Standard]:
    'Built for growing clinics that want reminders, inventory, and larger storage.',
  [SubscriptionPlan.Premium]:
    'Built for larger clinics that need more storage, more patients, and clinic branch management.',
};

export const PlanSelector: FunctionComponent<Props> = ({
  state,
  setState,
  currentPlan,
}): JSX.Element => {
  const { selectedPlan, selectedMonths, isSubmitting } = state;

  const handleMonthsChange = (_: MouseEvent<HTMLElement>, val: SubscriptionMonths | null) => {
    if (!val) {
      return;
    }

    setState((prev: SubscriptionStateModel) => ({ ...prev, selectedMonths: val }));
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setState((prev: SubscriptionStateModel) => ({ ...prev, selectedPlan: plan }));
  };

  const handleProceed = () => {
    if (!selectedPlan) {
      return;
    }

    setState((prev: SubscriptionStateModel) => ({ ...prev, step: 'checkout' }));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Subscription Plans
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Choose a plan and billing period, then continue with PayMongo or manual payment.
      </Typography>

      <Stack direction="row" alignItems="center" spacing={2} mb={4} flexWrap="wrap" gap={1}>
        <Typography variant="body2" fontWeight={500}>
          Billing period:
        </Typography>
        <ToggleButtonGroup
          value={selectedMonths}
          exclusive
          onChange={handleMonthsChange}
          size="small"
        >
          {SUBSCRIPTION_VISIBLE_MONTHS_OPTIONS.map((m) => (
            <ToggleButton key={m} value={m} sx={{ px: 2 }}>
              {MONTHS_LABEL[m]}
              {m === 12 && (
                <Chip
                  label="Save ~25%"
                  size="small"
                  color="success"
                  sx={{ ml: 1, height: 18, fontSize: 10 }}
                />
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        {ALL_PLANS.map((plan) => {
          const price = getPrice(plan, selectedMonths);
          const isActive = selectedPlan === plan;
          const normalizedCurrentPlan = currentPlan?.toLowerCase();
          const isCurrent =
            normalizedCurrentPlan === plan.toLowerCase() ||
            (normalizedCurrentPlan === 'premuim' && plan === SubscriptionPlan.Premium);

          return (
            <Card
              key={plan}
              variant="outlined"
              onClick={() => handleSelectPlan(plan)}
              sx={{
                flex: 1,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: isActive ? 'primary.main' : 'divider',
                bgcolor: isActive ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="overline" color={isActive ? 'primary' : 'text.secondary'}>
                    {PLAN_TAGLINE[plan]}
                  </Typography>
                  {isCurrent ? <Chip label="Current" color="primary" size="small" /> : null}
                </Stack>

                <Typography variant="h6" fontWeight={700}>
                  {plan}
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={1}>
                  {PLAN_DESCRIPTION[plan]}
                </Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.5} my={1}>
                  <Typography variant="h4" fontWeight={800}>
                    {formatCurrency(price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {MONTHS_LABEL[selectedMonths]}
                  </Typography>
                </Stack>

                {selectedMonths > 1 ? (
                  <Typography variant="caption" color="success.main">
                    Approx. {formatCurrency(Math.round(price / selectedMonths))} / month
                  </Typography>
                ) : null}

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1}>
                  {PLAN_FEATURES[plan].map((feature, index) => (
                    <Stack key={feature} direction="row" spacing={1} alignItems="center">
                      {FEATURE_INCLUDED[plan][index] ? (
                        <CheckCircleRoundedIcon
                          fontSize="small"
                          color={isActive ? 'primary' : 'action'}
                        />
                      ) : (
                        <CancelRoundedIcon fontSize="small" sx={{ color: 'error.light' }} />
                      )}
                      <Typography
                        variant="body2"
                        color={isActive ? 'text.primary' : 'text.secondary'}
                      >
                        {feature}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant={isActive ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectPlan(plan);
                  }}
                >
                  {isActive ? `${plan} Selected` : `Select ${plan}`}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      <Box textAlign="right">
        <Button
          variant="contained"
          size="large"
          disabled={!selectedPlan || isSubmitting}
          onClick={handleProceed}
        >
          Continue to Payment
        </Button>
      </Box>
    </Box>
  );
};

export default PlanSelector;

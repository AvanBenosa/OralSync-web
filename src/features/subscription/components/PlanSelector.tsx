import { FunctionComponent, JSX } from 'react';
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import {
  formatCurrency,
  getPrice,
  MONTHS_LABEL,
  PLAN_FEATURES,
  SUBSCRIPTION_MONTHS_OPTIONS,
  SubscriptionMonths,
  SubscriptionPlan,
  SubscriptionStateModel,
} from '../api/types';

type Props = {
  state: SubscriptionStateModel;
  setState: Function;
  currentPlan?: string;
};

// Both Basic and Standard are selectable — Premium is disabled (commented out)
const ALL_PLANS: SubscriptionPlan[] = [SubscriptionPlan.Basic, SubscriptionPlan.Standard];

// Which features are included per plan — index matches PLAN_FEATURES arrays
const FEATURE_INCLUDED: Record<SubscriptionPlan, boolean[]> = {
  [SubscriptionPlan.Basic]: [true, true, true, false, false, false],
  [SubscriptionPlan.Standard]: [true, true, true, true, true, true],
};

// Plan taglines shown in the card overline
const PLAN_TAGLINE: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]: 'Starter clinic plan',
  [SubscriptionPlan.Standard]: 'Balanced everyday plan',
};

// Plan short description shown below the title
const PLAN_DESCRIPTION: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]:
    'Best for solo or startup clinics handling a lighter daily patient load.',
  [SubscriptionPlan.Standard]:
    'Built for growing clinics that want reminders, inventory, and larger storage.',
};

export const PlanSelector: FunctionComponent<Props> = ({
  state,
  setState,
  currentPlan,
}): JSX.Element => {
  const { selectedPlan, selectedMonths, isSubmitting } = state;

  const handleMonthsChange = (_: React.MouseEvent<HTMLElement>, val: SubscriptionMonths | null) => {
    if (!val) return;
    setState((prev: SubscriptionStateModel) => ({ ...prev, selectedMonths: val }));
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setState((prev: SubscriptionStateModel) => ({ ...prev, selectedPlan: plan }));
  };

  const handleProceed = () => {
    if (!selectedPlan) return;
    setState((prev: SubscriptionStateModel) => ({ ...prev, step: 'checkout' }));
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Subscription Plans
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Choose a plan and billing period. Pay securely via GCash.
      </Typography>

      {/* Billing period toggle */}
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
          {SUBSCRIPTION_MONTHS_OPTIONS.map((m) => (
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

      {/* Plan cards — Basic + Standard both selectable */}
      {/* Premium is intentionally commented out — not yet available */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
        {ALL_PLANS.map((plan) => {
          const price = getPrice(plan, selectedMonths);
          const isActive = selectedPlan === plan;
          const isCurrent =
            currentPlan?.toLowerCase() === plan.toLowerCase() ||
            // normalise backend typo "premuim" just in case it ever appears
            (currentPlan?.toLowerCase() === 'premuim' && plan === SubscriptionPlan.Standard);

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
                {/* Overline + current badge */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="overline" color={isActive ? 'primary' : 'text.secondary'}>
                    {PLAN_TAGLINE[plan]}
                  </Typography>
                  {isCurrent && <Chip label="Current" color="primary" size="small" />}
                </Stack>

                {/* Plan name */}
                <Typography variant="h6" fontWeight={700}>
                  {plan}
                </Typography>

                {/* Short description */}
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {PLAN_DESCRIPTION[plan]}
                </Typography>

                {/* Price */}
                <Stack direction="row" alignItems="baseline" spacing={0.5} my={1}>
                  <Typography variant="h4" fontWeight={800}>
                    {formatCurrency(price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {MONTHS_LABEL[selectedMonths]}
                  </Typography>
                </Stack>

                {/* Per-month breakdown for multi-month */}
                {selectedMonths > 1 && (
                  <Typography variant="caption" color="success.main">
                    ≈ {formatCurrency(Math.round(price / selectedMonths))} / month
                  </Typography>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Feature list */}
                <Stack spacing={1}>
                  {PLAN_FEATURES[plan].map((f, i) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="center">
                      {FEATURE_INCLUDED[plan][i] ? (
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
                        {f}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  variant={isActive ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan);
                  }}
                >
                  {isActive ? `✓ ${plan} Selected` : `Select ${plan}`}
                </Button>
              </CardActions>
            </Card>
          );
        })}

        {/* ── Premium — DISABLED, coming soon ───────────────────────────── */}
        {/*
        <Card variant="outlined" sx={{ flex: 1, opacity: 0.4, pointerEvents: 'none' }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Coming Soon</Typography>
            <Typography variant="h6" fontWeight={700}>Premium</Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced clinic operations with AI, unlimited users, and priority support.
            </Typography>
          </CardContent>
        </Card>
        */}
      </Stack>

      {/* Proceed button */}
      <Box textAlign="right">
        <Button
          variant="contained"
          size="large"
          disabled={!selectedPlan || isSubmitting}
          onClick={handleProceed}
        >
          Continue to Payment →
        </Button>
      </Box>
    </Box>
  );
};

export default PlanSelector;

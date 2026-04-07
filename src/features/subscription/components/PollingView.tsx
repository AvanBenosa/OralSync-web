import { FunctionComponent, JSX, useEffect, useRef } from 'react';
import { Alert, Box, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material';
import { handlePollPaymentStatus } from '../api/handlers';
import { PaymentStatus, SubscriptionStateModel } from '../api/types';

type Props = {
  state: SubscriptionStateModel;
  setState: Function;
};

const POLL_INTERVAL_MS = 4000; // check every 4 seconds
const MAX_POLL_COUNT = 60; // give up after 4 minutes (60 × 4s)

export const PollingView: FunctionComponent<Props> = ({ state, setState }): JSX.Element => {
  const { transaction, pollCount } = state;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!transaction?.payMongoLinkId) return;

    // Start polling
    intervalRef.current = setInterval(async () => {
      await handlePollPaymentStatus(transaction, setState);
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction?.payMongoLinkId]);

  // Stop polling when max attempts reached
  useEffect(() => {
    if (pollCount >= MAX_POLL_COUNT && intervalRef.current) {
      clearInterval(intervalRef.current);
      setState((prev: SubscriptionStateModel) => ({
        ...prev,
        step: 'checkout', // send back to checkout so they can retry
      }));
    }
  }, [pollCount, setState]);

  const isExpired =
    transaction?.status === PaymentStatus.Expired || transaction?.status === PaymentStatus.Failed;

  const progress = Math.min((pollCount / MAX_POLL_COUNT) * 100, 100);

  return (
    <Box textAlign="center" py={6}>
      {isExpired ? (
        <>
          <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
            This payment link has expired or failed. Please go back and generate a new one.
          </Alert>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() =>
              setState((prev: SubscriptionStateModel) => ({
                ...prev,
                step: 'plans',
                transaction: null,
              }))
            }
          >
            ← Back to Plans
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={56} sx={{ mb: 3 }} />
          <Typography variant="h6" fontWeight={600} mb={1}>
            Waiting for Payment Confirmation
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Checking payment status automatically every {POLL_INTERVAL_MS / 1000} seconds…
          </Typography>

          <Box sx={{ width: 280, mx: 'auto', mb: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
          </Box>

          <Stack spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Reference: <strong>{transaction?.payMongoReferenceNumber || '—'}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Attempt {pollCount + 1} of {MAX_POLL_COUNT}
            </Typography>
          </Stack>

          <Alert severity="info" sx={{ mt: 4, textAlign: 'left', maxWidth: 420, mx: 'auto' }}>
            Keep this page open. Your account will activate automatically once GCash confirms the
            payment.
          </Alert>
        </>
      )}
    </Box>
  );
};

export default PollingView;

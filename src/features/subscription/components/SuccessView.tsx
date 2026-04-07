import { FunctionComponent, JSX } from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  formatCurrency,
  MONTHS_LABEL,
  SubscriptionMonths,
  SubscriptionStateModel,
} from '../api/types';

type Props = {
  state: SubscriptionStateModel;
  onDone: () => void;
};

export const SuccessView: FunctionComponent<Props> = ({ state, onDone }): JSX.Element => {
  const { transaction } = state;

  return (
    <Box textAlign="center" py={4}>
      <CheckCircleRoundedIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />

      <Typography variant="h5" fontWeight={700} mb={1}>
        Payment Successful!
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Your subscription has been activated. Thank you for choosing OralSync.
      </Typography>

      {/* Receipt summary */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
          mb: 4,
          maxWidth: 360,
          mx: 'auto',
          textAlign: 'left',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Receipt
        </Typography>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Plan</Typography>
          <Chip label={transaction?.subscriptionType} color="primary" size="small" />
        </Stack>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Duration</Typography>
          <Typography variant="body2" fontWeight={600}>
            {MONTHS_LABEL[(transaction?.subscriptionMonths ?? 1) as SubscriptionMonths]}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Amount Paid</Typography>
          <Typography variant="body2" fontWeight={600} color="primary">
            {formatCurrency(transaction?.amount ?? 0)}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Payment Method</Typography>
          <Typography variant="body2" fontWeight={600}>
            GCash
          </Typography>
        </Stack>

        {transaction?.payMongoReferenceNumber && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Reference No.
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {transaction.payMongoReferenceNumber}
              </Typography>
            </Stack>
          </>
        )}

        {transaction?.paidAt && (
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              Paid At
            </Typography>
            <Typography variant="caption">
              {new Date(transaction.paidAt).toLocaleString('en-PH')}
            </Typography>
          </Stack>
        )}
      </Box>

      <Button variant="contained" size="large" onClick={onDone}>
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default SuccessView;

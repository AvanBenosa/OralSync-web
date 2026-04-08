import { FunctionComponent, JSX } from 'react';
import { Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import {
  formatCurrency,
  MONTHS_LABEL,
  PaymentChannel,
  PaymentStatus,
  SubscriptionMonths,
  SubscriptionStateModel,
} from '../api/types';

type Props = {
  state: SubscriptionStateModel;
  onDone: () => void | Promise<void>;
  doneLabel?: string;
};

export const SuccessView: FunctionComponent<Props> = ({
  state,
  onDone,
  doneLabel = 'Go to Dashboard',
}): JSX.Element => {
  const { transaction } = state;
  const isManualPayment = transaction?.paymentChannel === PaymentChannel.Manual;
  const isPendingManualPayment =
    isManualPayment && transaction?.status === PaymentStatus.Pending;

  const title = isPendingManualPayment ? 'Manual Payment Submitted' : 'Payment Successful!';
  const description = isPendingManualPayment
    ? 'Your proof of payment is pending review. Your selected plan and new validity date will be applied once the payment is marked as paid.'
    : 'Your subscription has been activated. Thank you for choosing OralSync.';
  const referenceNumber =
    transaction?.referenceNumber || transaction?.payMongoReferenceNumber || '-';
  const paymentDate = transaction?.submittedAt || transaction?.paidAt || transaction?.createdAt;

  return (
    <Box textAlign="center" py={4}>
      {isPendingManualPayment ? (
        <HourglassTopRoundedIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
      ) : (
        <CheckCircleRoundedIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
      )}

      <Typography variant="h5" fontWeight={700} mb={1}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        {description}
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3,
          mb: 4,
          maxWidth: 380,
          mx: 'auto',
          textAlign: 'left',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {isPendingManualPayment ? 'Submission Summary' : 'Receipt'}
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
          <Typography variant="body2">Amount</Typography>
          <Typography variant="body2" fontWeight={600} color="primary">
            {formatCurrency(transaction?.amount ?? 0)}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Payment Method</Typography>
          <Typography variant="body2" fontWeight={600}>
            {transaction?.paymentMethod || 'GCash'}
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Status</Typography>
          <Chip
            label={transaction?.status || '-'}
            size="small"
            color={isPendingManualPayment ? 'warning' : 'success'}
            variant={isPendingManualPayment ? 'outlined' : 'filled'}
          />
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            Reference No.
          </Typography>
          <Typography variant="caption" fontWeight={600}>
            {referenceNumber}
          </Typography>
        </Stack>

        {paymentDate ? (
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              {isPendingManualPayment ? 'Submitted At' : 'Paid At'}
            </Typography>
            <Typography variant="caption">
              {new Date(paymentDate).toLocaleString('en-PH')}
            </Typography>
          </Stack>
        ) : null}
      </Box>

      <Button variant="contained" size="large" onClick={() => void onDone()}>
        {doneLabel}
      </Button>
    </Box>
  );
};

export default SuccessView;

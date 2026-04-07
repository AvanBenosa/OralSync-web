import { FunctionComponent, JSX } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import QrCodeRoundedIcon from '@mui/icons-material/QrCodeRounded';
import { QRCodeSVG } from 'qrcode.react';
import {
  formatCurrency,
  MONTHS_LABEL,
  SubscriptionMonths,
  SubscriptionStateModel,
} from '../api/types';
import { handleCreatePaymentLink, handleStartPaymentStatusCheck } from '../api/handlers';

type Props = {
  state: SubscriptionStateModel;
  setState: Function;
};

export const CheckoutView: FunctionComponent<Props> = ({ state, setState }): JSX.Element => {
  const { selectedPlan, selectedMonths, transaction, isSubmitting } = state;

  const hasLink = Boolean(transaction?.checkoutUrl);
  const amount = transaction?.amount ?? 0;
  const expiresAt = transaction?.expiresAt;

  const handleStartPolling = async () => {
    if (!transaction) return;
    await handleStartPaymentStatusCheck(transaction, setState);
  };

  const handleBack = () => {
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      step: 'plans',
      transaction: null,
    }));
  };

  const handleGenerateLink = async () => {
    if (!selectedPlan) return;
    await handleCreatePaymentLink(selectedPlan, selectedMonths, setState);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Complete Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Scan the QR code with your GCash app or open the checkout link.
      </Typography>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          mb: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Order Summary
        </Typography>
        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Plan</Typography>
          <Typography variant="body2" fontWeight={600}>
            {selectedPlan}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2">Duration</Typography>
          <Typography variant="body2" fontWeight={600}>
            {MONTHS_LABEL[selectedMonths as SubscriptionMonths]}
          </Typography>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body1" fontWeight={700}>
            Total
          </Typography>
          <Typography variant="body1" fontWeight={700} color="primary">
            {formatCurrency(amount)}
          </Typography>
        </Stack>
      </Box>

      {!hasLink ? (
        <Box textAlign="center" py={4}>
          <QrCodeRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" mb={2}>
            Click below to generate your secure payment link.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateLink}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Generating...' : 'Generate Payment Link'}
          </Button>
        </Box>
      ) : (
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" mb={2}>
            Scan this QR code with your <strong>GCash app</strong>
          </Typography>

          <Box
            sx={{
              display: 'inline-block',
              p: 2,
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: 2,
              bgcolor: '#fff',
              mb: 2,
            }}
          >
            <QRCodeSVG
              value={transaction?.checkoutUrl ?? ''}
              size={200}
              level="H"
              includeMargin={false}
            />
          </Box>

          <Typography variant="caption" display="block" color="text.secondary" mb={1}>
            Reference No: <strong>{transaction?.payMongoReferenceNumber || '-'}</strong>
          </Typography>

          {expiresAt && (
            <Typography variant="caption" display="block" color="warning.main" mb={2}>
              Link expires: {new Date(expiresAt).toLocaleString('en-PH')}
            </Typography>
          )}

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" mb={3}>
            <Button
              variant="outlined"
              startIcon={<OpenInNewRoundedIcon />}
              href={transaction?.checkoutUrl ?? ''}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Checkout Page
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => void handleStartPolling()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Checking...' : "I've Paid - Check Status"}
            </Button>
          </Stack>

          <Alert severity="info" sx={{ textAlign: 'left' }}>
            After paying in GCash, click <strong>"I've Paid"</strong> and your subscription will
            activate automatically within seconds.
          </Alert>
        </Box>
      )}

      <Box mt={3}>
        <Button variant="text" onClick={handleBack} disabled={isSubmitting}>
          {'<- Back to Plans'}
        </Button>
      </Box>
    </Box>
  );
};

export default CheckoutView;

import { ChangeEvent, FunctionComponent, JSX } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import QrCodeRoundedIcon from '@mui/icons-material/QrCodeRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { QRCodeSVG } from 'qrcode.react';
import {
  formatCurrency,
  getPrice,
  MANUAL_PAYMENT_METHOD_LABELS,
  ManualPaymentMethod,
  MONTHS_LABEL,
  PaymentChannel,
  PAYMENT_CHANNEL_LABELS,
  SubscriptionMonths,
  SubscriptionStateModel,
} from '../api/types';
import {
  handleCreateManualPayment,
  handleStartPaymentStatusCheck,
  handleUploadManualPaymentProof,
} from '../api/handlers';

type Props = {
  state: SubscriptionStateModel;
  setState: Function;
};

export const CheckoutView: FunctionComponent<Props> = ({ state, setState }): JSX.Element => {
  const {
    selectedPlan,
    selectedMonths,
    paymentChannel,
    manualPayment,
    transaction,
    isSubmitting,
    isUploadingProof,
    errorMessage,
  } = state;

  const hasLink = Boolean(transaction?.checkoutUrl);
  const amount = transaction?.amount ?? (selectedPlan ? getPrice(selectedPlan, selectedMonths) : 0);
  const expiresAt = transaction?.expiresAt;
  const isManualPayment = paymentChannel === PaymentChannel.Manual;

  const handleStartPolling = async () => {
    if (!transaction) {
      return;
    }

    await handleStartPaymentStatusCheck(transaction, setState);
  };

  const handleBack = () => {
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      step: 'plans',
      transaction: null,
      errorMessage: null,
    }));
  };

  const handleChannelChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: PaymentChannel | null
  ) => {
    if (!value) {
      return;
    }

    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      paymentChannel: value,
      errorMessage: null,
    }));
  };

  const handleManualFieldChange =
    (field: 'paymentMethod' | 'senderName' | 'referenceNumber') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = String(event.target.value ?? '');
      setState((prev: SubscriptionStateModel) => ({
        ...prev,
        errorMessage: null,
        manualPayment: {
          ...prev.manualPayment,
          ...(field === 'paymentMethod'
            ? {
                paymentMethod:
                  nextValue as SubscriptionStateModel['manualPayment']['paymentMethod'],
              }
            : { [field]: nextValue }),
        },
      }));
    };

  const handleProofChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await handleUploadManualPaymentProof(file, manualPayment.proofImageUrl, setState);
    event.target.value = '';
  };

  const handleManualSubmit = async () => {
    if (!selectedPlan) {
      return;
    }

    if (
      !manualPayment.paymentMethod ||
      !manualPayment.senderName.trim() ||
      !manualPayment.referenceNumber.trim() ||
      !manualPayment.proofImageUrl.trim()
    ) {
      setState((prev: SubscriptionStateModel) => ({
        ...prev,
        errorMessage: 'Complete all manual payment fields and upload the proof of payment.',
      }));
      return;
    }

    await handleCreateManualPayment(selectedPlan, selectedMonths, manualPayment, setState);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Complete Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Choose PayMongo for instant confirmation or manual payment to submit proof for review.
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

      <Stack direction="row" alignItems="center" spacing={2} mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="body2" fontWeight={600}>
          Payment method:
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={paymentChannel}
          onChange={handleChannelChange}
          size="small"
        >
          {(Object.values(PaymentChannel) as PaymentChannel[]).map((channel) => (
            <ToggleButton key={channel} value={channel}>
              {PAYMENT_CHANNEL_LABELS[channel]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      ) : null}

      {!isManualPayment ? (
        !hasLink ? (
          <Box textAlign="center" py={4}>
            {/*
            <Box textAlign="center" py={4}>
              <QrCodeRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" mb={2}>
                Click below to generate your secure PayMongo payment link.
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
            */}
            <QrCodeRoundedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Alert severity="info" sx={{ maxWidth: 460, mx: 'auto', textAlign: 'left' }}>
              PayMongo checkout is coming soon. Please use Manual Payment for now while online
              payment activation is being finalized.
            </Alert>
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
        )
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Send the amount to your agreed manual payment account, then upload the proof here. Once
            submitted, the payment will stay pending until an admin validates it.
          </Alert>

          <Stack spacing={2.5}>
            <TextField
              select
              label="Manual Payment Type"
              size="small"
              fullWidth
              value={manualPayment.paymentMethod}
              onChange={handleManualFieldChange('paymentMethod')}
            >
              {Object.entries(MANUAL_PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            {manualPayment.paymentMethod === ManualPaymentMethod.GCash ? (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Scan to Pay via GCash
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Send the exact amount to this GCash account, then upload your proof of payment
                  below.
                </Typography>
                <Box textAlign="center">
                  <Box
                    component="img"
                    src="/gcash_QR.jpg"
                    alt="GCash QR code for manual payment"
                    sx={{
                      width: '100%',
                      maxWidth: 280,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={700} mt={1.5}>
                    0921 359 192
                  </Typography>
                </Box>
              </Box>
            ) : manualPayment.paymentMethod === ManualPaymentMethod.BankTransfer ? (
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Scan to Pay via BPI
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Send the exact amount to this BPI account, then upload your proof of payment
                  below.
                </Typography>
                <Box textAlign="center">
                  <Box
                    component="img"
                    src="/bpi_QR.jpg"
                    alt="BPI QR code for manual payment"
                    sx={{
                      width: '100%',
                      maxWidth: 280,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={700} mt={1.5}>
                    8289392943
                  </Typography>
                </Box>
              </Box>
            ) : null}

            <TextField
              label="Sender Name"
              size="small"
              fullWidth
              value={manualPayment.senderName}
              onChange={handleManualFieldChange('senderName')}
            />

            <TextField
              label="Reference Number"
              size="small"
              fullWidth
              value={manualPayment.referenceNumber}
              onChange={handleManualFieldChange('referenceNumber')}
            />

            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Proof of Payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload a screenshot or photo of the receipt.
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    {isUploadingProof
                      ? 'Uploading proof...'
                      : manualPayment.proofFileName || 'No proof uploaded yet'}
                  </Typography>
                </Box>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadRoundedIcon />}
                  disabled={isUploadingProof || isSubmitting}
                >
                  {isUploadingProof ? 'Uploading...' : 'Upload Proof'}
                  <input hidden accept="image/*" type="file" onChange={handleProofChange} />
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                bgcolor: 'background.default',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <ReceiptLongRoundedIcon sx={{ color: 'primary.main', mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2">What happens after submission</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your transaction status will be set to pending. Your selected plan and new
                    validity date will only be applied after the payment status is updated to Paid.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box textAlign="right">
              <Button
                variant="contained"
                color="success"
                onClick={() => void handleManualSubmit()}
                disabled={isSubmitting || isUploadingProof}
                startIcon={
                  isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Manual Payment'}
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      <Box mt={3}>
        <Button variant="text" onClick={handleBack} disabled={isSubmitting || isUploadingProof}>
          {'<- Back to Plans'}
        </Button>
      </Box>
    </Box>
  );
};

export default CheckoutView;

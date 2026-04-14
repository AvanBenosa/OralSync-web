import { FunctionComponent, JSX, useState } from 'react';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useAuthStore } from '../../../common/store/authStore';
import { isClinicWideRole } from '../../../common/utils/branch-access';
import {
  HandleSendSmsGateway,
  HandleSendSmsGatewayTest,
  ValidateSmsGatewayPhone,
} from './api/handlers';

const SmsGatewaySettings: FunctionComponent = (): JSX.Element => {
  const currentUserRole = useAuthStore((store) => store.user?.role || '');
  const canTest = isClinicWideRole(currentUserRole);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (value: string): boolean => {
    const validationResult = ValidateSmsGatewayPhone(value);
    setPhoneError(validationResult.errorMessage);
    return validationResult.isValid;
  };

  const handleSendTest = async (): Promise<void> => {
    if (!validatePhone(phoneNumber)) {
      return;
    }

    setIsSending(true);
    try {
      await HandleSendSmsGatewayTest({
        phoneNumber,
      });
    } catch {
      // API and handler layers surface the error toast.
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSms = async (number: string, message: string): Promise<void> => {
    if (!validatePhone(number)) {
      return;
    }

    setIsSending(true);
    try {
      await HandleSendSmsGateway({
        phoneNumber: number,
        message,
      });
    } catch {
      // API and handler layers surface the error toast.
    } finally {
      setIsSending(false);
    }
  };

  void handleSendSms;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 640 }}>
      {/* Info card */}
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroidRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Android SMS Gateway
            </Typography>
          </Box>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            OralSync can send SMS messages directly through an Android phone acting as an SMS
            server. The Android device must have the <strong>SMS Gateway API</strong> app installed
            and be accessible on the same network as this server.
          </Typography>
          <Alert severity="info" sx={{ mt: 0.5 }}>
            Configure your gateway URL in{' '}
            <strong>Settings → Clinic Profile → Android SMS Gateway</strong> section. Each clinic
            stores its own gateway URL in the database.
          </Alert>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Chip label="Configured per clinic in database" size="small" variant="outlined" />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Endpoint
              </Typography>
              <Chip label="POST /api/dmd/android-sms/send" size="small" variant="outlined" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Test SMS card */}
      {canTest ? (
        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SendRoundedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={600}>
                Test SMS
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Send a test message to verify the Android Gateway is reachable and working. The
              Android device must be powered on and connected to the network.
            </Typography>
            <TextField
              label="Phone Number"
              placeholder="09171234567"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (phoneError) validatePhone(e.target.value);
              }}
              error={Boolean(phoneError)}
              helperText={phoneError || 'Enter a Philippine mobile number'}
              size="small"
              fullWidth
              inputProps={{ maxLength: 16 }}
            />
            <Box>
              <Button
                variant="contained"
                disableElevation
                startIcon={
                  isSending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SendRoundedIcon fontSize="small" />
                  )
                }
                disabled={isSending}
                onClick={() => void handleSendTest()}
              >
                {isSending ? 'Sending…' : 'Send Test SMS'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="warning">
          Only clinic-wide administrators can send test SMS messages.
        </Alert>
      )}

      {/* Setup guide */}
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Setup Guide
          </Typography>
          <Divider />
          <Box
            component="ol"
            sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}
          >
            <Typography component="li" variant="body2">
              Install <strong>SMS Gateway API</strong> from Google Play on your Android device.
            </Typography>
            <Typography component="li" variant="body2">
              Launch the app and note the displayed IP address and port (e.g.{' '}
              <code>http://192.168.1.10:8080</code>).
            </Typography>
            <Typography component="li" variant="body2">
              Go to <strong>Settings → Clinic Profile</strong>, scroll to the{' '}
              <strong>Android SMS Gateway</strong> section, enter the Base URL, enable the gateway,
              and click <em>Save Gateway Settings</em>.
            </Typography>
            <Typography component="li" variant="body2">
              Ensure the Android device and server are on the same network (or exposed via a public
              IP / ngrok tunnel).
            </Typography>
            <Typography component="li" variant="body2">
              Use the Test SMS button above to confirm connectivity.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SmsGatewaySettings;

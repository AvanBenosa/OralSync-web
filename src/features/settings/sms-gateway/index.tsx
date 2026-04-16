import { ChangeEvent, FunctionComponent, JSX, useEffect, useState } from 'react';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useAuthStore } from '../../../common/store/authStore';
import { isClinicWideRole } from '../../../common/utils/branch-access';
import {
  GetSmsGatewayConfiguration,
  SaveSmsGatewayConfiguration,
  SendSmsGatewayTest,
} from './api/api';
import { ValidateSmsGatewayPhone } from './api/handlers';
import {
  createDefaultSmsGatewayConfiguration,
  type SmsGatewayConfigurationModel,
} from './api/types';

const SmsGatewaySettings: FunctionComponent = (): JSX.Element => {
  const currentUserRole = useAuthStore((store) => store.user?.role || '');
  const canManageGateway = isClinicWideRole(currentUserRole);

  const [form, setForm] = useState<SmsGatewayConfigurationModel>(
    createDefaultSmsGatewayConfiguration()
  );
  const [loadingConfiguration, setLoadingConfiguration] = useState(canManageGateway);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!canManageGateway) {
      setLoadingConfiguration(false);
      return;
    }

    let isMounted = true;

    GetSmsGatewayConfiguration()
      .then((configuration) => {
        if (!isMounted) {
          return;
        }

        setForm(configuration);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setForm(createDefaultSmsGatewayConfiguration());
        setErrorMessage('Failed to load gateway settings. You can save them again from this tab.');
      })
      .finally(() => {
        if (isMounted) {
          setLoadingConfiguration(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canManageGateway]);

  const clearFeedback = (): void => {
    setStatusMessage('');
    setErrorMessage('');
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;

    setForm((prev) => {
      if (name === 'baseUrl') {
        return {
          ...prev,
          baseUrl: value,
        };
      }

      if (name === 'sendEndpoint') {
        return {
          ...prev,
          sendEndpoint: value,
        };
      }

      if (name === 'apiKey') {
        return {
          ...prev,
          apiKey: value,
        };
      }

      return {
        ...prev,
        timeoutMilliseconds: value === '' ? 0 : Number(value),
      };
    });

    clearFeedback();
  };

  const handleToggle = (_: ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    setForm((prev) => ({
      ...prev,
      isEnabled: checked,
    }));
    clearFeedback();
  };

  const validatePhone = (value: string): boolean => {
    const validationResult = ValidateSmsGatewayPhone(value);
    setPhoneError(validationResult.errorMessage);
    return validationResult.isValid;
  };

  const handleSave = async (): Promise<void> => {
    clearFeedback();
    setSaving(true);

    try {
      const savedConfiguration = await SaveSmsGatewayConfiguration({
        ...form,
        baseUrl: form.baseUrl.trim(),
        sendEndpoint: form.sendEndpoint.trim() || '/message',
        apiKey: form.apiKey?.trim() || null,
        timeoutMilliseconds:
          Number.isFinite(form.timeoutMilliseconds) && form.timeoutMilliseconds > 0
            ? form.timeoutMilliseconds
            : 30000,
      });

      setForm(savedConfiguration);
      setStatusMessage('Android SMS Gateway settings saved.');
    } catch {
      setErrorMessage('Failed to save Android SMS Gateway settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (): Promise<void> => {
    if (!validatePhone(phoneNumber)) {
      return;
    }

    clearFeedback();
    setTesting(true);

    try {
      await SendSmsGatewayTest({
        phoneNumber: phoneNumber.trim(),
      });
      setStatusMessage('Test SMS sent successfully.');
    } catch {
      setErrorMessage(
        'Test SMS failed. Check the gateway settings and make sure the device is reachable.'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 960 }}>
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
        </CardContent>
      </Card>

      {!canManageGateway ? (
        <Alert severity="warning">
          Only clinic-wide administrators can configure and test gateway settings.
        </Alert>
      ) : null}

      {statusMessage ? (
        <Alert severity="success" onClose={() => setStatusMessage('')}>
          {statusMessage}
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      ) : null}

      {canManageGateway ? (
        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SaveRoundedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={600}>
                Gateway Settings
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Save the Android device URL, endpoint, and optional API key used by this clinic when
              sending SMS messages.
            </Typography>

            {loadingConfiguration ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading gateway settings...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch checked={form.isEnabled} onChange={handleToggle} color="primary" />
                    }
                    label={form.isEnabled ? 'Gateway Enabled' : 'Gateway Disabled'}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Base URL"
                    name="baseUrl"
                    value={form.baseUrl}
                    onChange={handleFieldChange}
                    placeholder="http://192.168.1.10:8082"
                    fullWidth
                    size="small"
                    helperText="IP address and port of the SMS Gateway API app"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Send Endpoint"
                    name="sendEndpoint"
                    value={form.sendEndpoint}
                    onChange={handleFieldChange}
                    placeholder="/message"
                    fullWidth
                    size="small"
                    helperText="Path appended to the base URL"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="API Key (optional)"
                    name="apiKey"
                    value={form.apiKey ?? ''}
                    onChange={handleFieldChange}
                    placeholder="Leave blank if not required"
                    fullWidth
                    size="small"
                    type="password"
                    helperText="Sent as the Authorization header when provided"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Timeout (ms)"
                    name="timeoutMilliseconds"
                    value={form.timeoutMilliseconds}
                    onChange={handleFieldChange}
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 1000 }}
                    helperText="Default: 30000"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      disableElevation
                      startIcon={
                        saving ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <SaveRoundedIcon fontSize="small" />
                        )
                      }
                      disabled={saving}
                      onClick={() => void handleSave()}
                    >
                      {saving ? 'Saving...' : 'Save Gateway Settings'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      ) : null}

      {canManageGateway ? (
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
              onChange={(event) => {
                setPhoneNumber(event.target.value);
                if (phoneError) {
                  validatePhone(event.target.value);
                }
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
                  testing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SendRoundedIcon fontSize="small" />
                  )
                }
                disabled={testing || loadingConfiguration}
                onClick={() => void handleSendTest()}
              >
                {testing ? 'Sending...' : 'Send Test SMS'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}

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
              Install <strong>Traccar SMS Gateway</strong> from Google Play on your Android device.
            </Typography>
            <Typography component="li" variant="body2">
              Launch the app and note the displayed IP address and port (e.g.{' '}
              <code>http://192.168.1.10:8080</code>).
            </Typography>
            <Typography component="li" variant="body2">
              Go to <strong>Settings -&gt; SMS Gateway</strong>, enter the Base URL, enable the
              gateway, and click <em>Save Gateway Settings</em>.
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

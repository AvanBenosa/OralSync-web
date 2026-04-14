import { ChangeEvent, FunctionComponent, JSX, useEffect, useState } from 'react';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  AndroidSmsGatewayModel,
  GetAndroidSmsGateway,
  SaveAndroidSmsGateway,
  TestAndroidSmsGateway,
  defaultAndroidSmsGatewayModel,
} from '../clinic-profile/api/android-sms-gateway-api';
import styles from '../style.scss.module.scss';

const AndroidSmsGatewayPanel: FunctionComponent = (): JSX.Element => {
  const [form, setForm] = useState<AndroidSmsGatewayModel>(defaultAndroidSmsGatewayModel());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testPhoneError, setTestPhoneError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    GetAndroidSmsGateway()
      .then((data) => setForm(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveStatus('');
    setSaveError('');
  };

  const handleToggle = (_: ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    setForm((prev) => ({ ...prev, isEnabled: checked }));
    setSaveStatus('');
    setSaveError('');
  };

  const handleSave = async (): Promise<void> => {
    setSaveStatus('');
    setSaveError('');
    setSaving(true);
    try {
      const saved = await SaveAndroidSmsGateway({
        ...form,
        timeoutMilliseconds: Number(form.timeoutMilliseconds) || 30000,
        apiKey: form.apiKey?.trim() || null,
      });
      setForm(saved);
      setSaveStatus('Android SMS Gateway settings saved.');
    } catch {
      setSaveError('Failed to save Android SMS Gateway settings.');
    } finally {
      setSaving(false);
    }
  };

  const validateTestPhone = (value: string): boolean => {
    const ph = /^(09|\+?639)\d{9}$/;
    if (!value.trim()) {
      setTestPhoneError('Phone number is required.');
      return false;
    }
    if (!ph.test(value.trim())) {
      setTestPhoneError('Enter a valid PH mobile number (e.g. 09171234567).');
      return false;
    }
    setTestPhoneError('');
    return true;
  };

  const handleTest = async (): Promise<void> => {
    if (!validateTestPhone(testPhone)) return;
    setTesting(true);
    try {
      await TestAndroidSmsGateway(testPhone.trim());
      setSaveStatus('Test SMS sent successfully.');
    } catch {
      setSaveError('Test SMS failed. Check gateway settings and ensure the device is reachable.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.formPanel}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading gateway settings…
          </Typography>
        </Box>
      </section>
    );
  }

  return (
    <section className={styles.formPanel}>
      <div className={styles.formPanelHeader}>
        <div className={styles.formPanelIcon} aria-hidden="true">
          <PhoneAndroidRoundedIcon />
        </div>
        <div>
          <h3 className={styles.formPanelTitle}>Android SMS Gateway</h3>
          <p className={styles.formPanelDescription}>
            Configure your clinic's Android phone as an SMS gateway. Each clinic uses its own device
            and URL.
          </p>
        </div>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={<Switch checked={form.isEnabled} onChange={handleToggle} color="primary" />}
            label={form.isEnabled ? 'Gateway Enabled' : 'Gateway Disabled'}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            label="Base URL"
            name="baseUrl"
            value={form.baseUrl}
            onChange={handleChange}
            placeholder="http://192.168.1.10:8082"
            fullWidth
            size="small"
            helperText="IP address and port of the Traccar SMS Gateway app"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Send Endpoint"
            name="sendEndpoint"
            value={form.sendEndpoint}
            onChange={handleChange}
            placeholder="/"
            fullWidth
            size="small"
            helperText="Path appended to Base URL"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            label="API Key (optional)"
            name="apiKey"
            value={form.apiKey ?? ''}
            onChange={handleChange}
            placeholder="Leave blank if not required"
            fullWidth
            size="small"
            type="password"
            helperText="Sent as Authorization: Basic header if provided"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Timeout (ms)"
            name="timeoutMilliseconds"
            value={form.timeoutMilliseconds}
            onChange={handleChange}
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
              size="small"
              startIcon={
                saving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SaveRoundedIcon fontSize="small" />
                )
              }
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save Gateway Settings'}
            </Button>
          </Box>
        </Grid>
        {saveStatus ? (
          <Grid size={{ xs: 12 }}>
            <Alert severity="success" onClose={() => setSaveStatus('')}>
              {saveStatus}
            </Alert>
          </Grid>
        ) : null}
        {saveError ? (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" onClose={() => setSaveError('')}>
              {saveError}
            </Alert>
          </Grid>
        ) : null}
        Test section
        <Grid size={{ xs: 12 }}>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Test SMS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Send a test message to verify the gateway is reachable.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                label="Phone Number"
                placeholder="09171234567"
                value={testPhone}
                onChange={(e) => {
                  setTestPhone(e.target.value);
                  if (testPhoneError) validateTestPhone(e.target.value);
                }}
                error={Boolean(testPhoneError)}
                helperText={testPhoneError || ' '}
                size="small"
                inputProps={{ maxLength: 16 }}
                sx={{ width: 220 }}
              />
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 0.25 }}
                startIcon={
                  testing ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <SendRoundedIcon fontSize="small" />
                  )
                }
                disabled={testing}
                onClick={() => void handleTest()}
              >
                {testing ? 'Sending…' : 'Send Test'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </section>
  );
};

export default AndroidSmsGatewayPanel;

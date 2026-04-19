import { type ChangeEvent, FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  type SelectChangeEvent,
  Snackbar,
  Typography,
} from '@mui/material';
import AdminPageShell from '../components/admin-page-shell';
import { getSetup, updateSetup } from './api/api';
import { ActiveSMSConfig, type ActiveSMSConfigValue, type SetupModel } from './api/types';

const SMS_CONFIG_OPTIONS: { value: ActiveSMSConfigValue; label: string }[] = [
  { value: ActiveSMSConfig.AndroidSmsGateway, label: 'Android SMS Gateway' },
  { value: ActiveSMSConfig.Semaphore, label: 'Semaphore' },
];

const normalizeSMSConfig = (
  value: ActiveSMSConfigValue | number | string | null | undefined
): ActiveSMSConfigValue => {
  const numericValue = Number(value);

  if (numericValue === ActiveSMSConfig.Semaphore) {
    return ActiveSMSConfig.Semaphore;
  }

  return ActiveSMSConfig.AndroidSmsGateway;
};

const getSMSConfigLabel = (
  value: ActiveSMSConfigValue | number | string | null | undefined,
  fallbackLabel?: string
): string => {
  const normalizedValue = normalizeSMSConfig(value);
  return (
    SMS_CONFIG_OPTIONS.find((option) => option.value === normalizedValue)?.label
    || fallbackLabel
    || 'Select SMS Provider'
  );
};

const SetupModule: FunctionComponent = (): JSX.Element => {
  const [setup, setSetup] = useState<SetupModel | null>(null);
  const [selectedSMSConfig, setSelectedSMSConfig] = useState<ActiveSMSConfigValue>(
    ActiveSMSConfig.AndroidSmsGateway
  );
  const [selectedShowBetaTestingDialog, setSelectedShowBetaTestingDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchSetup = async () => {
    setLoading(true);
    try {
      const data = await getSetup();
      const normalizedData = {
        ...data,
        activeSMSConfig: normalizeSMSConfig(data.activeSMSConfig),
      };
      setSetup(normalizedData);
      setSelectedSMSConfig(normalizedData.activeSMSConfig);
      setSelectedShowBetaTestingDialog(Boolean(data.showBetaTestingDialog));
    } catch {
      setSnackbar({ open: true, message: 'Failed to load setup configuration.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSetup();
  }, []);

  const persistSetup = async (
    nextSMSConfig: ActiveSMSConfigValue,
    nextShowBetaTestingDialog: boolean,
    rollback: () => void
  ): Promise<void> => {
    setSaving(true);
    try {
      const updated = await updateSetup({
        activeSMSConfig: nextSMSConfig,
        showBetaTestingDialog: nextShowBetaTestingDialog,
      });
      const normalizedUpdated = {
        ...updated,
        activeSMSConfig: normalizeSMSConfig(updated.activeSMSConfig),
      };
      setSetup(normalizedUpdated);
      setSelectedSMSConfig(normalizedUpdated.activeSMSConfig);
      setSelectedShowBetaTestingDialog(Boolean(normalizedUpdated.showBetaTestingDialog));
      setSnackbar({ open: true, message: 'Setup saved automatically.', severity: 'success' });
    } catch {
      rollback();
      setSnackbar({ open: true, message: 'Failed to save setup configuration.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSMSConfigChange = (event: SelectChangeEvent<number>) => {
    const nextSMSConfig = normalizeSMSConfig(event.target.value);
    if (nextSMSConfig === selectedSMSConfig || saving) {
      return;
    }

    const previousSMSConfig = selectedSMSConfig;
    setSelectedSMSConfig(nextSMSConfig);

    void persistSetup(nextSMSConfig, selectedShowBetaTestingDialog, () => {
      setSelectedSMSConfig(previousSMSConfig);
    });
  };

  const handleShowBetaTestingDialogChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextShowBetaTestingDialog = event.target.checked;
    if (nextShowBetaTestingDialog === selectedShowBetaTestingDialog || saving) {
      return;
    }

    const previousShowBetaTestingDialog = selectedShowBetaTestingDialog;
    setSelectedShowBetaTestingDialog(nextShowBetaTestingDialog);

    void persistSetup(selectedSMSConfig, nextShowBetaTestingDialog, () => {
      setSelectedShowBetaTestingDialog(previousShowBetaTestingDialog);
    });
  };

  return (
    <AdminPageShell
      title="Setup"
      description="Manage system-wide configuration for OralSync."
      loading={loading}
      onReload={fetchSetup}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#16324f', mb: 2 }}>
            SMS Configuration
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { sm: 'center' },
            }}
          >
            <FormControl sx={{ minWidth: 280 }} disabled={loading || saving}>
              <InputLabel id="sms-config-label">Active SMS Provider</InputLabel>
              <Select<number>
                labelId="sms-config-label"
                label="Active SMS Provider"
                value={selectedSMSConfig}
                onChange={handleSMSConfigChange}
                renderValue={(value) => getSMSConfigLabel(value, setup?.activeSMSConfigLabel)}
              >
                {SMS_CONFIG_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
            {saving ? (
              <CircularProgress size={16} />
            ) : (
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '999px',
                  bgcolor: '#2aa876',
                  boxShadow: '0 0 0 4px rgba(42, 168, 118, 0.14)',
                }}
              />
            )}
            <Typography sx={{ fontSize: '0.88rem', color: '#5f7489' }}>
              {saving ? 'Saving changes...' : 'Changes save automatically.'}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '18px',
            border: '1px solid rgba(202, 214, 226, 0.9)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,248,252,0.98) 100%)',
            boxShadow: '0 14px 28px rgba(22, 50, 79, 0.06)',
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#16324f', mb: 0.75 }}>
            Beta Testing Dialog
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: '#5a7088', mb: 2 }}>
            Control whether clinics must accept the beta testing agreement before entering the
            system.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={selectedShowBetaTestingDialog}
                onChange={handleShowBetaTestingDialogChange}
                disabled={loading || saving}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#16324f' }}>
                  Require beta testing dialog
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#6b7f93' }}>
                  When disabled, the beta testing dialog will not appear and clinics will not be
                  blocked for beta acceptance.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0, gap: 1.5 }}
          />
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminPageShell>
  );
};

export default SetupModule;

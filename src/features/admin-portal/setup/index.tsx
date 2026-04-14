import { FunctionComponent, JSX, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Snackbar,
  Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AdminPageShell from '../components/admin-page-shell';
import { getSetup, updateSetup } from './api/api';
import { ActiveSMSConfig, type ActiveSMSConfigValue, type SetupModel } from './api/types';

const SMS_CONFIG_OPTIONS: { value: ActiveSMSConfigValue; label: string }[] = [
  { value: ActiveSMSConfig.AndroidSmsGateway, label: 'Android SMS Gateway' },
  { value: ActiveSMSConfig.Semaphore, label: 'Semaphore' },
];

const SetupModule: FunctionComponent = (): JSX.Element => {
  const [setup, setSetup] = useState<SetupModel | null>(null);
  const [selectedSMSConfig, setSelectedSMSConfig] = useState<ActiveSMSConfigValue>(
    ActiveSMSConfig.AndroidSmsGateway
  );
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
      setSetup(data);
      setSelectedSMSConfig(data.activeSMSConfig);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load setup configuration.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleSMSConfigChange = (event: SelectChangeEvent<number>) => {
    setSelectedSMSConfig(event.target.value as ActiveSMSConfigValue);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateSetup({ activeSMSConfig: selectedSMSConfig });
      setSetup(updated);
      setSelectedSMSConfig(updated.activeSMSConfig);
      setSnackbar({ open: true, message: 'Setup saved successfully.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save setup configuration.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = setup !== null && selectedSMSConfig !== setup.activeSMSConfig;

  return (
    <AdminPageShell
      title="Setup"
      description="Manage system-wide configuration for OralSync."
      loading={loading}
      onReload={fetchSetup}
    >
      <Box>
        <Typography
          sx={{ fontSize: '1rem', fontWeight: 700, color: '#16324f', mb: 2 }}
        >
          SMS Configuration
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
          <FormControl sx={{ minWidth: 260 }} disabled={loading || saving}>
            <InputLabel id="sms-config-label">Active SMS Provider</InputLabel>
            <Select<number>
              labelId="sms-config-label"
              label="Active SMS Provider"
              value={selectedSMSConfig}
              onChange={handleSMSConfigChange}
            >
              {SMS_CONFIG_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || saving || !isDirty}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              height: 56,
              px: 3,
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
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

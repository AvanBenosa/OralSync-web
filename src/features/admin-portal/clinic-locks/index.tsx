import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { toast } from 'react-toastify';
import { toastConfig } from '../../../common/api/responses';
import AdminPageShell from '../components/admin-page-shell';
import AdminEmptyState from '../components/admin-empty-state';
import { handleGetAdminClinics, handleUpdateClinicLockStatus } from '../api/handlers';
import { AdminClinicModel, AdminClinicsStateModel } from '../api/types';

const SUBSCRIPTION_OPTIONS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Premuim', label: 'Premium' },
] as const;

type ClinicEditFormState = {
  clinicId: string;
  clinicName: string;
  contact: string;
  subscriptionType: string;
  validityDate: string;
  isLocked: boolean;
};

const formatSubscriptionType = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  return value
    .replace(/^Premuim$/i, 'Premium')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatDateInputValue = (value?: string): string => {
  if (!value?.trim()) {
    return '';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return '';
  }

  return parsedDate.toISOString().slice(0, 10);
};

const formatValidityDate = (value?: string): string => {
  if (!value?.trim()) {
    return '--';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1) {
    return '--';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ClinicLockModule: FunctionComponent = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [state, setState] = useState<AdminClinicsStateModel>({
    items: [],
    load: true,
    error: '',
  });
  const [submittingClinicId, setSubmittingClinicId] = useState<string>('');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState<ClinicEditFormState>({
    clinicId: '',
    clinicName: '',
    contact: '',
    subscriptionType: '',
    validityDate: '',
    isLocked: false,
  });
  const lastLoadedRef = useRef(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClinics = async (forceRefresh: boolean = false): Promise<void> => {
    if (forceRefresh) {
      setState((prev) => ({
        ...prev,
        load: true,
      }));
    }

    try {
      await handleGetAdminClinics(setState, forceRefresh);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load clinic lock controls.',
      }));
    }
  };

  useEffect(() => {
    if (lastLoadedRef.current) {
      return;
    }

    lastLoadedRef.current = true;
    void loadClinics(false);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      toast.info('Clinic lock data has been refreshed.', toastConfig);
      void loadClinics(true);
    }, 250);
  };

  const handleOpenEditModal = (item: AdminClinicModel): void => {
    setEditError('');
    setEditForm({
      clinicId: item.id || '',
      clinicName: item.clinicName || '--',
      contact: item.contactNumber || item.emailAddress || '--',
      subscriptionType: item.subscriptionType || '',
      validityDate: formatDateInputValue(item.validityDate),
      isLocked: Boolean(item.isLocked),
    });
    setOpenEditModal(true);
  };

  const handleCloseEditModal = (): void => {
    if (submittingClinicId) {
      return;
    }

    setOpenEditModal(false);
    setEditError('');
    setEditForm({
      clinicId: '',
      clinicName: '',
      contact: '',
      subscriptionType: '',
      validityDate: '',
      isLocked: false,
    });
  };

  const handleSaveClinicSettings = async (): Promise<void> => {
    if (!editForm.clinicId) {
      setEditError('Clinic was not found.');
      return;
    }

    if (!editForm.subscriptionType) {
      setEditError('Select a subscription type.');
      return;
    }

    if (!editForm.validityDate) {
      setEditError('Select a validity date.');
      return;
    }

    setSubmittingClinicId(editForm.clinicId);
    setEditError('');

    try {
      const updatedClinic = await handleUpdateClinicLockStatus({
        clinicId: editForm.clinicId,
        isLocked: editForm.isLocked,
        subscriptionType: editForm.subscriptionType,
        validityDate: editForm.validityDate,
      });

      setState((prev) => ({
        ...prev,
        error: '',
        items: prev.items.map((item) => (item.id === updatedClinic.id ? updatedClinic : item)),
      }));

      toast.success('Clinic settings have been updated.', toastConfig);
      handleCloseEditModal();
    } catch (error: any) {
      const message =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : 'Unable to update clinic settings.';

      setEditError(message);
      setState((prev) => ({
        ...prev,
        error: '',
      }));
    } finally {
      setSubmittingClinicId('');
    }
  };

  return (
    <AdminPageShell
      title="Clinic Lock Controls"
      description="Lock or unlock clinic workspaces from the admin portal."
      loading={state.load}
      onReload={handleReload}
    >
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}
      {state.load && state.items.length === 0 ? (
        <CircularProgress size={28} />
      ) : state.items.length === 0 ? (
        <AdminEmptyState
          title="No clinics available"
          description="Connect this page to the admin clinics endpoint to manage clinic lock status."
        />
      ) : isMobile ? (
        <Grid container spacing={1.25}>
          {state.items.map((item, index) => (
            <Grid size={{ xs: 12 }} key={item.id || `${item.clinicName || 'clinic'}-${index}`}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(22,50,79,0.08)',
                  backgroundColor: '#fbfdff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                      {item.clinicName || '--'}
                    </Typography>
                    <Typography sx={{ color: '#6a8094', fontSize: '0.82rem', mt: 0.35 }}>
                      {item.ownerName || '--'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      handleOpenEditModal(item);
                    }}
                    disabled={!item.id || submittingClinicId === item.id}
                    sx={{
                      width: 34,
                      height: 34,
                      border: '1px solid rgba(22,50,79,0.1)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <EditRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                  </IconButton>
                </Box>

                <Grid container spacing={1.25} sx={{ mt: 0.6 }}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      sx={{
                        color: '#70869a',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Contact
                    </Typography>
                    <Typography
                      sx={{ color: '#17344f', fontSize: '0.9rem', wordBreak: 'break-word' }}
                    >
                      {item.contactNumber || item.emailAddress || '--'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      sx={{
                        color: '#70869a',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Status
                    </Typography>
                    <Typography
                      sx={{ color: item.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}
                    >
                      {item.isLocked ? 'Locked' : 'Active'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      sx={{
                        color: '#70869a',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Subscription
                    </Typography>
                    <Typography sx={{ color: '#17344f', fontSize: '0.9rem' }}>
                      {formatSubscriptionType(item.subscriptionType)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      sx={{
                        color: '#70869a',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Validity Date
                    </Typography>
                    <Typography sx={{ color: '#17344f', fontSize: '0.9rem' }}>
                      {formatValidityDate(item.validityDate)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography
                      sx={{
                        color: '#70869a',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        mb: 0.2,
                      }}
                    >
                      Lock Access
                    </Typography>
                    <Typography
                      sx={{ color: item.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}
                    >
                      {item.isLocked ? 'Locked' : 'Unlocked'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Subscription Type</TableCell>
                <TableCell>Validity Date</TableCell>
                <TableCell>Current Status</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.items.map((item, index) => (
                <TableRow key={item.id || `${item.clinicName || 'clinic'}-${index}`}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                      {item.clinicName || '--'}
                    </Typography>
                    <Typography sx={{ color: '#6a8094', fontSize: '0.85rem' }}>
                      {item.ownerName || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.contactNumber || item.emailAddress || '--'}</TableCell>
                  <TableCell>{formatSubscriptionType(item.subscriptionType)}</TableCell>
                  <TableCell>{formatValidityDate(item.validityDate)}</TableCell>
                  <TableCell>
                    <Typography
                      sx={{ color: item.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}
                    >
                      {item.isLocked ? 'Locked' : 'Active'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        handleOpenEditModal(item);
                      }}
                      disabled={!item.id || submittingClinicId === item.id}
                      sx={{
                        width: 36,
                        height: 36,
                        border: '1px solid rgba(22,50,79,0.1)',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <EditRoundedIcon sx={{ fontSize: 18, color: '#24507a' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Update Clinic Settings</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {editError ? (
              <Grid size={{ xs: 12 }}>
                <Alert severity="error">{editError}</Alert>
              </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Clinic Name"
                fullWidth
                value={editForm.clinicName}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Contact"
                fullWidth
                value={editForm.contact}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Subscription Type"
                select
                fullWidth
                value={editForm.subscriptionType}
                onChange={(event) => {
                  setEditError('');
                  setEditForm((prev) => ({
                    ...prev,
                    subscriptionType: event.target.value,
                  }));
                }}
              >
                {SUBSCRIPTION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Validity Date"
                type="date"
                fullWidth
                value={editForm.validityDate}
                onChange={(event) => {
                  setEditError('');
                  setEditForm((prev) => ({
                    ...prev,
                    validityDate: event.target.value,
                  }));
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: '1px solid rgba(22,50,79,0.08)',
                  backgroundColor: '#fbfdff',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#17344f' }}>Lock Access</Typography>
                  <Typography sx={{ color: '#6a8094', fontSize: '0.84rem' }}>
                    Turn this on to lock the clinic workspace.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Typography
                    sx={{ color: editForm.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}
                  >
                    {editForm.isLocked ? 'Locked' : 'Unlocked'}
                  </Typography>
                  <Switch
                    checked={editForm.isLocked}
                    color="error"
                    onChange={(_, checked) => {
                      setEditError('');
                      setEditForm((prev) => ({
                        ...prev,
                        isLocked: checked,
                      }));
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseEditModal}
            color="inherit"
            disabled={Boolean(submittingClinicId)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void handleSaveClinicSettings();
            }}
            disabled={Boolean(submittingClinicId)}
          >
            {submittingClinicId ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageShell>
  );
};

export default ClinicLockModule;

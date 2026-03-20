import { FunctionComponent, JSX, useEffect, useRef, useState } from 'react';
import {
  Alert,
  CircularProgress,
  Grid,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { toast } from 'react-toastify';
import { toastConfig } from '../../../common/api/responses';
import AdminPageShell from '../components/admin-page-shell';
import AdminEmptyState from '../components/admin-empty-state';
import { handleGetAdminClinics, handleUpdateClinicLockStatus } from '../api/handlers';
import { AdminClinicsStateModel } from '../api/types';

const ClinicLockModule: FunctionComponent = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [state, setState] = useState<AdminClinicsStateModel>({
    items: [],
    load: true,
    error: '',
  });
  const [submittingClinicId, setSubmittingClinicId] = useState<string>('');
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

  const handleToggleClinicLock = async (clinicId: string, isLocked: boolean): Promise<void> => {
    if (!clinicId) {
      return;
    }

    setSubmittingClinicId(clinicId);

    try {
      await handleUpdateClinicLockStatus({
        clinicId,
        isLocked,
      });

      setState((prev) => ({
        ...prev,
        error: '',
        items: prev.items.map((item) =>
          item.id === clinicId
            ? {
                ...item,
                isLocked,
              }
            : item
        ),
      }));

      toast.success(
        `Clinic has been ${isLocked ? 'locked' : 'unlocked'}.`,
        toastConfig
      );

      await loadClinics(true);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to update clinic lock status.',
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
      {state.error ? <Alert severity="error" sx={{ mb: 2 }}>{state.error}</Alert> : null}
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
              <Typography
                component="div"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid rgba(22,50,79,0.08)',
                  backgroundColor: '#fbfdff',
                }}
              >
                <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                  {item.clinicName || '--'}
                </Typography>
                <Typography sx={{ color: '#6a8094', fontSize: '0.82rem', mt: 0.35 }}>
                  {item.ownerName || '--'}
                </Typography>

                <Grid container spacing={1.25} sx={{ mt: 0.6 }}>
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Contact
                    </Typography>
                    <Typography sx={{ color: '#17344f', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                      {item.contactNumber || item.emailAddress || '--'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Status
                    </Typography>
                    <Typography sx={{ color: item.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}>
                      {item.isLocked ? 'Locked' : 'Active'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ color: '#70869a', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.2 }}>
                      Lock Access
                    </Typography>
                    <Switch
                      checked={Boolean(item.isLocked)}
                      onChange={(_, checked) => {
                        void handleToggleClinicLock(item.id || '', checked);
                      }}
                      disabled={!item.id || submittingClinicId === item.id}
                      color="error"
                      sx={{ ml: -1 }}
                    />
                  </Grid>
                </Grid>
              </Typography>
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
                <TableCell>Current Status</TableCell>
                <TableCell align="right">Lock Access</TableCell>
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
                  <TableCell>
                    <Typography sx={{ color: item.isLocked ? '#c62828' : '#156c43', fontWeight: 800 }}>
                      {item.isLocked ? 'Locked' : 'Active'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={Boolean(item.isLocked)}
                      onChange={(_, checked) => {
                        void handleToggleClinicLock(item.id || '', checked);
                      }}
                      disabled={!item.id || submittingClinicId === item.id}
                      color="error"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </AdminPageShell>
  );
};

export default ClinicLockModule;

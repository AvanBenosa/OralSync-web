import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
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
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import RoundedPagination from '../../../common/components/RoundedPagination';
import TableLoadingSkeleton from '../../../common/components/TableLoadingSkeleton';
import { toastConfig } from '../../../common/api/responses';
import {
  loadProtectedAssetObjectUrl,
  resolveProtectedApiAssetUrl,
} from '../../../common/services/api-client';
import AdminEmptyState from '../components/admin-empty-state';
import AdminPageShell from '../components/admin-page-shell';
import { handleGetAdminClinics, handleGetAdminManualPaymentRequests } from '../api/handlers';
import { updateAdminClinicManualPaymentStatus } from '../api/api';
import { type AdminClinicManualPaymentModel, type AdminClinicModel } from '../api/types';
import { formatManualPaymentAmount, formatManualPaymentDate, formatManualPaymentStatus } from '../clinic-locks/manual-payment-records/utils';

type PaymentRequestsStateModel = {
  items: AdminClinicManualPaymentModel[];
  clinics: AdminClinicModel[];
  load: boolean;
  error: string;
  pageStart: number;
  pageEnd: number;
  selectedClinicId: string;
  selectedStatus: string;
  openModal: boolean;
  selectedItem?: AdminClinicManualPaymentModel;
};

type StatusFormValues = {
  id: string;
  clinicId: string;
  status: string;
  rejectionReason: string;
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Failed', label: 'Rejected' },
  { value: 'Expired', label: 'Expired' },
];

const STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter((item) => item.value);

const createInitialValues = (
  selectedItem?: AdminClinicManualPaymentModel
): StatusFormValues => ({
  id: selectedItem?.id || '',
  clinicId: selectedItem?.clinicId || '',
  status: selectedItem?.status || 'Pending',
  rejectionReason: selectedItem?.rejectionReason || '',
});

const PaymentRequestsModule: FunctionComponent = (): JSX.Element => {
  const [state, setState] = useState<PaymentRequestsStateModel>({
    items: [],
    clinics: [],
    load: true,
    error: '',
    pageStart: 0,
    pageEnd: 10,
    selectedClinicId: '',
    selectedStatus: '',
    openModal: false,
  });
  const lastLoadedRef = useRef(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentFilter = useMemo(
    () => ({
      clinicId: state.selectedClinicId || undefined,
      status: state.selectedStatus || undefined,
    }),
    [state.selectedClinicId, state.selectedStatus]
  );
  const visibleItems = useMemo(
    () => state.items.slice(state.pageStart, state.pageStart + state.pageEnd),
    [state.items, state.pageEnd, state.pageStart]
  );

  const loadItems = async (
    nextFilter: { clinicId?: string; status?: string } = currentFilter,
    forceRefresh: boolean = false,
    includeClinics: boolean = false,
    resetPageStart: boolean = false
  ): Promise<void> => {
    setState((prev) => ({
      ...prev,
      load: true,
      error: '',
    }));

    try {
      const [items, clinics] = await Promise.all([
        handleGetAdminManualPaymentRequests(nextFilter, forceRefresh),
        includeClinics ? handleGetAdminClinics(() => undefined, forceRefresh) : Promise.resolve(state.clinics),
      ]);

      setState((prev) => ({
        ...prev,
        items,
        clinics,
        load: false,
        error: '',
        pageStart:
          resetPageStart || prev.pageStart >= items.length
            ? 0
            : prev.pageStart,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        load: false,
        error:
          typeof error?.response?.data === 'string'
            ? error.response.data
            : 'Unable to load payment requests.',
      }));
    }
  };

  useEffect(() => {
    if (lastLoadedRef.current) {
      return;
    }

    lastLoadedRef.current = true;
    void loadItems(currentFilter, false, true);

    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = (): void => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      void loadItems(currentFilter, true, true);
    }, 250);
  };

  const handleFilterChange =
    (field: 'selectedClinicId' | 'selectedStatus') =>
    async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): Promise<void> => {
      const value = String(event.target.value ?? '');
      const nextFilter = {
        clinicId: field === 'selectedClinicId' ? value || undefined : state.selectedClinicId || undefined,
        status: field === 'selectedStatus' ? value || undefined : state.selectedStatus || undefined,
      };

      setState((prev) => ({
        ...prev,
        [field]: value,
        pageStart: 0,
      }));

      await loadItems(nextFilter, true, false, true);
    };

  const openProof = async (proofImageUrl?: string): Promise<void> => {
    if (!proofImageUrl?.trim()) {
      return;
    }

    try {
      const url = proofImageUrl.startsWith('/storage/')
        ? await loadProtectedAssetObjectUrl(proofImageUrl)
        : resolveProtectedApiAssetUrl(proofImageUrl);

      if (!url) {
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Unable to open the proof of payment.', toastConfig);
    }
  };

  return (
    <AdminPageShell
      title="Payment Request"
      description="Review manual payment submissions from all clinics, filter by status or clinic, and verify requests from one admin queue."
      loading={state.load}
      onReload={handleReload}
    >
      {state.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: '1px solid rgba(22,50,79,0.08)',
          boxShadow: 'none',
          mb: 2,
          background: 'linear-gradient(180deg, rgba(248,251,253,0.96), rgba(242,247,251,0.98))',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
          <TuneRoundedIcon sx={{ color: '#24507a' }} />
          <Typography sx={{ fontWeight: 800, color: '#17344f' }}>Filters</Typography>
        </Stack>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Clinic"
              value={state.selectedClinicId}
              onChange={(event) => void handleFilterChange('selectedClinicId')(event)}
            >
              <MenuItem value="">All Clinics</MenuItem>
              {state.clinics.map((clinic) => (
                <MenuItem key={clinic.id || clinic.clinicName} value={clinic.id || ''}>
                  {clinic.clinicName || '--'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={state.selectedStatus}
              onChange={(event) => void handleFilterChange('selectedStatus')(event)}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          minHeight: { xs: 460, md: 620 },
          maxHeight: { xs: 'none', md: 760 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TableContainer
          sx={{
            flex: 1,
            minHeight: 0,
            maxHeight: { xs: 'none', md: 680 },
          }}
        >
          <Table stickyHeader aria-label="Admin payment request table">
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.load ? (
                <TableLoadingSkeleton
                  rowCount={6}
                  desktopCells={[
                    { width: '20%' },
                    { width: '18%' },
                    { width: '14%' },
                    { width: '12%' },
                    { width: '16%' },
                    { width: '12%' },
                    { kind: 'actions', align: 'right', itemCount: 2 },
                  ]}
                />
              ) : state.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ borderBottom: 0, py: 9 }}>
                    <AdminEmptyState
                      title="No payment requests found"
                      description="Manual payment requests that match the selected filters will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                visibleItems.map((item, index) => (
                  <TableRow hover key={item.id || `payment-request-${index}`}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: '#17344f' }}>
                        {item.clinicName || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#1f4467' }}>
                        {formatManualPaymentDate(item.submittedAt)}
                      </Typography>
                      <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                        Ref: {item.referenceNumber || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                        {item.subscriptionType || '--'}
                      </Typography>
                      <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                        {item.subscriptionMonths ? `${item.subscriptionMonths} month(s)` : '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatManualPaymentAmount(item.amount)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                        {item.senderName || '--'}
                      </Typography>
                      <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                        {item.paymentMethod || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                        {formatManualPaymentStatus(item.status)}
                      </Typography>
                      <Typography sx={{ color: '#6f8297', fontSize: '0.84rem' }}>
                        {item.verifiedAt
                          ? `Verified ${formatManualPaymentDate(item.verifiedAt)}`
                          : item.rejectionReason || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<OpenInNewRoundedIcon />}
                          onClick={() => void openProof(item.proofImageUrl)}
                          disabled={!item.proofImageUrl}
                        >
                          Proof
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedItem: item,
                              openModal: true,
                            }))
                          }
                          disabled={String(item.status || '').toLowerCase() === 'paid'}
                        >
                          {String(item.status || '').toLowerCase() === 'paid' ? 'Paid' : 'Update'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!state.load && state.items.length > 0 ? (
          <Box
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: 1.5,
              borderTop: '1px solid rgba(22,50,79,0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#fff',
            }}
          >
            <RoundedPagination
              page={Math.floor(state.pageStart / Math.max(state.pageEnd, 1)) + 1}
              pageSize={state.pageEnd}
              totalItems={state.items.length}
              onChange={(nextPage) => {
                setState((prev) => ({
                  ...prev,
                  pageStart: (nextPage - 1) * prev.pageEnd,
                }));
              }}
            />
          </Box>
        ) : null}
      </Paper>

      <Dialog
        open={state.openModal}
        onClose={() =>
          setState((prev) => ({
            ...prev,
            openModal: false,
          }))
        }
        TransitionProps={{
          onExited: () => {
            setState((prev) => ({
              ...prev,
              selectedItem: undefined,
            }));
          },
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Update Manual Payment Status</DialogTitle>
        <Formik
          enableReinitialize
          validateOnBlur={false}
          validateOnChange={false}
          initialValues={createInitialValues(state.selectedItem)}
          onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
            setStatus(undefined);

            if (!values.id || !values.clinicId) {
              setStatus('Manual payment record was not found.');
              setSubmitting(false);
              return;
            }

            if (String(state.selectedItem?.status || '').toLowerCase() === 'paid') {
              setStatus('Paid manual payment records can no longer be changed.');
              setSubmitting(false);
              return;
            }

            if (!values.status.trim()) {
              setStatus('Select a status.');
              setSubmitting(false);
              return;
            }

            if (
              values.status !== 'Paid' &&
              values.status !== 'Pending' &&
              !values.rejectionReason.trim()
            ) {
              setStatus('Provide a reason when rejecting or expiring the payment.');
              setSubmitting(false);
              return;
            }

            try {
              await updateAdminClinicManualPaymentStatus({
                id: values.id,
                clinicId: values.clinicId,
                status: values.status,
                rejectionReason: values.status === 'Paid' ? '' : values.rejectionReason,
              });

              toast.success('Manual payment status has been updated.', toastConfig);
              setState((prev) => ({
                ...prev,
                openModal: false,
                selectedItem: undefined,
              }));
              await loadItems(currentFilter, true, false, false);
            } catch (error) {
              if (isAxiosError(error)) {
                setStatus(
                  typeof error.response?.data === 'string' ? error.response.data : error.message
                );
              } else {
                setStatus('Unable to update manual payment status.');
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, status, handleChange, handleSubmit, isSubmitting }): JSX.Element => (
            <>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  {status ? (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="error">{status}</Alert>
                    </Grid>
                  ) : null}
                  {String(state.selectedItem?.status || '').toLowerCase() === 'paid' ? (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info">
                        Paid requests are locked and can no longer be updated.
                      </Alert>
                    </Grid>
                  ) : null}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Status"
                      name="status"
                      select
                      value={values.status}
                      onChange={handleChange}
                      disabled={String(state.selectedItem?.status || '').toLowerCase() === 'paid'}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Reason"
                      name="rejectionReason"
                      multiline
                      minRows={3}
                      value={values.rejectionReason}
                      onChange={handleChange}
                      placeholder="Required when status is Rejected or Expired."
                      disabled={
                        values.status === 'Paid' ||
                        values.status === 'Pending' ||
                        String(state.selectedItem?.status || '').toLowerCase() === 'paid'
                      }
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      openModal: false,
                      selectedItem: undefined,
                    }))
                  }
                  color="inherit"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit()}
                  disabled={
                    isSubmitting || String(state.selectedItem?.status || '').toLowerCase() === 'paid'
                  }
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogActions>
            </>
          )}
        </Formik>
      </Dialog>
    </AdminPageShell>
  );
};

export default PaymentRequestsModule;

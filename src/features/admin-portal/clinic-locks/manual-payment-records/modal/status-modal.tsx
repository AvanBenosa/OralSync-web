import { FunctionComponent, JSX } from 'react';
import { isAxiosError } from 'axios';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { toastConfig } from '../../../../../common/api/responses';
import { HandleUpdateClinicManualPaymentStatus } from '../api/handlers';
import type { ManualPaymentRecordsStateProps } from '../api/types';

type FormValues = {
  id: string;
  clinicId: string;
  status: string;
  rejectionReason: string;
};

const createInitialValues = (
  selectedItem?: ManualPaymentRecordsStateProps['state']['selectedItem']
): FormValues => ({
  id: selectedItem?.id || '',
  clinicId: selectedItem?.clinicId || '',
  status: selectedItem?.status || 'Pending',
  rejectionReason: selectedItem?.rejectionReason || '',
});

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Failed', label: 'Rejected' },
  { value: 'Expired', label: 'Expired' },
];

const ManualPaymentStatusModal: FunctionComponent<ManualPaymentRecordsStateProps> = ({
  state,
  setState,
}): JSX.Element => {
  const handleClose = (): void => {
    setState((prev: typeof state) => ({
      ...prev,
      openModal: false,
      selectedItem: undefined,
    }));
  };

  return (
    <>
      <DialogTitle sx={{ fontWeight: 800 }}>Update Manual Payment Status</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={createInitialValues(state.selectedItem)}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          if (!values.id || !values.clinicId) {
            setStatus('Manual payment record was not found.');
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
            !values.rejectionReason.trim() &&
            values.status !== 'Pending'
          ) {
            setStatus('Provide a reason when rejecting or expiring the payment.');
            setSubmitting(false);
            return;
          }

          try {
            await HandleUpdateClinicManualPaymentStatus(
              {
                id: values.id,
                clinicId: values.clinicId,
                status: values.status,
                rejectionReason: values.status === 'Paid' ? '' : values.rejectionReason,
              },
              setState
            );
            toast.success('Manual payment status has been updated.', toastConfig);
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
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Status"
                    name="status"
                    select
                    value={values.status}
                    onChange={handleChange}
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
                    disabled={values.status === 'Paid' || values.status === 'Pending'}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="contained" onClick={() => handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default ManualPaymentStatusModal;

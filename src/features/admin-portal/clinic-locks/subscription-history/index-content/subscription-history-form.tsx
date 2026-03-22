import { FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';

import { toastConfig } from '../../../../../common/api/responses';
import { SUBSCRIPTION_OPTIONS, toClinicDateInputValue } from '../../utils';
import {
  HandleCreateClinicSubscriptionHistoryItem,
  HandleUpdateClinicSubscriptionHistoryItem,
} from '../api/handlers';
import type { SubscriptionHistoryStateProps } from '../api/types';
import { DEFAULT_SUBSCRIPTION_TYPE } from '../utils';

type SubscriptionHistoryFormValues = {
  id: string;
  paymentDate: string;
  subscriptionType: string;
  totalAmount: string | number;
};

const toTrimmedString = (value: string | number | null | undefined): string =>
  String(value ?? '').trim();

const createInitialValues = (
  selectedItem?: SubscriptionHistoryStateProps['state']['selectedItem'],
  clinicSubscriptionType?: string
): SubscriptionHistoryFormValues => ({
  id: selectedItem?.id || '',
  paymentDate: toClinicDateInputValue(selectedItem?.paymentDate || new Date()),
  subscriptionType:
    selectedItem?.subscriptionType || clinicSubscriptionType || DEFAULT_SUBSCRIPTION_TYPE,
  totalAmount:
    selectedItem?.totalAmount === undefined || selectedItem?.totalAmount === null
      ? ''
      : String(selectedItem.totalAmount),
});

const SubscriptionHistoryForm: FunctionComponent<SubscriptionHistoryStateProps> = (
  props: SubscriptionHistoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Subscription History' : 'Add Subscription History'),
    [state.isUpdate]
  );

  const handleClose = (): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
  };

  return (
    <>
      <DialogTitle sx={{ fontWeight: 800 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={createInitialValues(state.selectedItem, state.clinic?.subscriptionType)}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);
          const paymentDate = toTrimmedString(values.paymentDate);
          const subscriptionType = toTrimmedString(values.subscriptionType);
          const totalAmountValue = toTrimmedString(values.totalAmount);

          if (!state.clinic?.id) {
            setStatus('Clinic was not found.');
            setSubmitting(false);
            return;
          }

          if (!paymentDate) {
            setStatus('Select a payment date.');
            setSubmitting(false);
            return;
          }

          if (!subscriptionType) {
            setStatus('Select a subscription type.');
            setSubmitting(false);
            return;
          }

          const totalAmount = Number(values.totalAmount);
          if (!totalAmountValue || Number.isNaN(totalAmount) || totalAmount < 0) {
            setStatus('Enter a valid total amount.');
            setSubmitting(false);
            return;
          }

          try {
            if (state.isUpdate && values.id) {
              await HandleUpdateClinicSubscriptionHistoryItem(
                {
                  id: values.id,
                  clinicId: state.clinic.id,
                  paymentDate,
                  subscriptionType,
                  totalAmount,
                },
                setState
              );
              toast.success('Subscription history has been updated.', toastConfig);
            } else {
              await HandleCreateClinicSubscriptionHistoryItem(
                {
                  clinicId: state.clinic.id,
                  paymentDate,
                  subscriptionType,
                  totalAmount,
                },
                setState
              );
              toast.success('Subscription history has been added.', toastConfig);
            }
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save subscription history.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting, status }): JSX.Element => {
          const parsedTotalAmount = Number(values.totalAmount);
          const paymentDate = toTrimmedString(values.paymentDate);
          const subscriptionType = toTrimmedString(values.subscriptionType);
          const totalAmountValue = toTrimmedString(values.totalAmount);
          const hasValidTotalAmount =
            totalAmountValue !== '' && !Number.isNaN(parsedTotalAmount) && parsedTotalAmount >= 0;

          return (
            <>
              <DialogContent dividers>
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    {status ? (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="error">{status}</Alert>
                      </Grid>
                    ) : null}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Payment Date"
                        name="paymentDate"
                        type="date"
                        fullWidth
                        value={values.paymentDate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Subscription Type"
                        name="subscriptionType"
                        select
                        fullWidth
                        value={values.subscriptionType}
                        onChange={handleChange}
                      >
                        {SUBSCRIPTION_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Total Amount"
                        name="totalAmount"
                        type="number"
                        fullWidth
                        value={values.totalAmount}
                        onChange={handleChange}
                        inputProps={{
                          min: 0,
                          step: '0.01',
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit()}
                  disabled={
                    isSubmitting ||
                    !paymentDate ||
                    !subscriptionType ||
                    !hasValidTotalAmount
                  }
                >
                  {isSubmitting ? 'Saving...' : state.isUpdate ? 'Save Changes' : 'Add History'}
                </Button>
              </DialogActions>
            </>
          );
        }}
      </Formik>
    </>
  );
};

export default SubscriptionHistoryForm;

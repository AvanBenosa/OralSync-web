import { ChangeEvent, FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { PatientOverViewModel, PatientOverViewStateProps } from '../api/types';
import { HandleCreatePatientOverViewItem, HandleUpdatePatientOverViewItem } from '../api/handlers';

type PatientOverViewFormValues = {
  id: string;
  date: string;
  assignedDoctor: string;
  procedure: string;
  amount: number | '';
  discount: number | '';
  totalAmountDue: number | '';
  amountPaid: number | '';
  remarks: string;
};

const createInitialValues = (selectedItem?: PatientOverViewModel): PatientOverViewFormValues => ({
  id: selectedItem?.id || '',
  date: selectedItem?.date
    ? new Date(selectedItem.date).toISOString().split('T')[0]
    : '',
  assignedDoctor: selectedItem?.assignedDoctor || '',
  procedure: selectedItem?.procedure || '',
  amount: selectedItem?.amount ?? '',
  discount: selectedItem?.discount ?? '',
  totalAmountDue: selectedItem?.totalAmountDue ?? '',
  amountPaid: selectedItem?.amountPaid ?? '',
  remarks: selectedItem?.remarks || '',
});

const parseNumberInput = (value: string): number | '' => {
  if (value.trim() === '') {
    return '';
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

const getNumericValue = (value: number | ''): number | undefined =>
  value === '' ? undefined : value;

const getTotalAmountDueValue = (amount: number | '', discount: number | ''): number | '' => {
  if (amount === '') {
    return '';
  }

  return amount - (discount === '' ? 0 : discount);
};

const getBalanceValue = (totalAmountDue: number | '', amountPaid: number | ''): number | '' => {
  if (totalAmountDue === '') {
    return '';
  }

  return totalAmountDue - (amountPaid === '' ? 0 : amountPaid);
};

const hasFourDigitYear = (value: string): boolean => {
  const [year] = value.split('-');
  return year.length === 4;
};

const OverViewForm: FunctionComponent<PatientOverViewStateProps> = (
  props: PatientOverViewStateProps
): JSX.Element => {
  const { state, setState } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Overview Record' : 'Add Overview Record'),
    [state.isUpdate]
  );

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmit = async (values: PatientOverViewFormValues): Promise<void> => {
    const totalAmountDue = getTotalAmountDueValue(values.amount, values.discount);
    const balance = getBalanceValue(totalAmountDue, values.amountPaid);

    const payload: PatientOverViewModel = {
      id: values.id.trim() || undefined,
      patientInfoId: state.patientId,
      date: values.date ? new Date(values.date) : undefined,
      assignedDoctor: values.assignedDoctor.trim() || undefined,
      procedure: values.procedure.trim(),
      amount: getNumericValue(values.amount),
      discount: getNumericValue(values.discount),
      totalAmountDue: getNumericValue(totalAmountDue),
      amountPaid: getNumericValue(values.amountPaid),
      balance: getNumericValue(balance),
      remarks: values.remarks.trim(),
    };

    if (state.isUpdate) {
      await HandleUpdatePatientOverViewItem(payload, state, setState);
      return;
    }

    await HandleCreatePatientOverViewItem(payload, state, setState);
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        validateOnBlur={false}
        initialValues={createInitialValues(state.selectedItem)}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          if (values.date && !hasFourDigitYear(values.date)) {
            setStatus('Date year must be exactly 4 digits.');
            setSubmitting(false);
            return;
          }

          try {
            await handleSubmit(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save overview record.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, status, setFieldValue }): JSX.Element => {
          const totalAmountDueValue = getTotalAmountDueValue(values.amount, values.discount);
          const balanceValue = getBalanceValue(totalAmountDueValue, values.amountPaid);

          return (
            <>
              <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0.5 }}>
                  {status ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {status}
                    </Alert>
                  ) : null}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Date"
                        name="date"
                        type="date"
                        value={values.date}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                      <TextField
                        label="Assigned Doctor"
                        name="assignedDoctor"
                        value={values.assignedDoctor}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                      <TextField
                        label="Procedure"
                        name="procedure"
                        value={values.procedure}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Amount"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amount', parseNumberInput(event.target.value))
                        }
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Discount"
                        name="discount"
                        type="number"
                        value={values.discount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('discount', parseNumberInput(event.target.value))
                        }
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Paid"
                        name="amountPaid"
                        type="number"
                        value={values.amountPaid}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amountPaid', parseNumberInput(event.target.value))
                        }
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Total Due"
                        name="totalAmountDue"
                        type="number"
                        disabled
                        value={totalAmountDueValue}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        label="Balance"
                        name="balance"
                        type="number"
                        disabled
                        value={balanceValue}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Remarks"
                        name="remarks"
                        value={values.remarks}
                        onChange={handleChange}
                        fullWidth
                        size="small"
                        multiline
                        minRows={3}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSubmit()}
                  variant="contained"
                  //disabled={isSubmitting || !values.paymentDate || !values.procedure.trim()}
                >
                  {state.isUpdate ? 'Update' : 'Save'}
                </Button>
              </DialogActions>
            </>
          );
        }}
      </Formik>
    </>
  );
};

export default OverViewForm;

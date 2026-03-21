import { ChangeEvent, FunctionComponent, JSX, useMemo } from 'react';
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

import {
  HandleCreateFinanceExpenseItem,
  HandleUpdateFinanceExpenseItem,
} from '../api/handlers';
import {
  CLINIC_EXPENSE_CATEGORY_OPTIONS,
  ClinicExpenseCategory,
  FinanceExpenseModel,
  FinanceExpenseStateProps,
  getClinicExpenseCategoryLabel,
} from '../api/types';
import { financeExpenseValidationSchema } from '../api/validation';

type FinanceOverviewExpenseFormProps = FinanceExpenseStateProps & {
  onSaved?: () => Promise<void> | void;
};

type FinanceOverviewExpenseFormValues = {
  id: string;
  date: string;
  category: ClinicExpenseCategory | '';
  remarks: string;
  amount: number | '';
};

const toDateInputValue = (value?: string | Date): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const dateOnlyValue = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (dateOnlyValue) {
      return dateOnlyValue;
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDatePayloadValue = (value?: string): string | undefined => {
  if (!value?.trim()) {
    return undefined;
  }

  return `${value}T00:00:00`;
};

const getTodayDateInputValue = (): string => toDateInputValue(new Date());

const createInitialValues = (
  selectedItem?: FinanceExpenseModel
): FinanceOverviewExpenseFormValues => ({
  id: selectedItem?.id || '',
  date: toDateInputValue(selectedItem?.date) || getTodayDateInputValue(),
  category: selectedItem?.category || '',
  remarks: selectedItem?.remarks || '',
  amount: selectedItem?.amount ?? '',
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

const FinanceOverviewExpenseForm: FunctionComponent<FinanceOverviewExpenseFormProps> = (
  props: FinanceOverviewExpenseFormProps
): JSX.Element => {
  const { state, setState, onSaved } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Expense' : 'Add Expense'),
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

  const handleSubmitForm = async (values: FinanceOverviewExpenseFormValues): Promise<void> => {
    const payload = {
      id: values.id.trim() || undefined,
      date: toDatePayloadValue(values.date),
      category: values.category || undefined,
      remarks: values.remarks.trim(),
      amount: getNumericValue(values.amount),
    };

    if (state.isUpdate) {
      await HandleUpdateFinanceExpenseItem(payload);
    } else {
      await HandleCreateFinanceExpenseItem(payload);
    }

    setState((prevState: typeof state) => ({
      ...prevState,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    }));
    await onSaved?.();
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={financeExpenseValidationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          try {
            await handleSubmitForm(values);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to save expense record.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          status,
          errors,
          touched,
          submitCount,
          setFieldValue,
        }): JSX.Element => {
          const shouldShowError = (fieldName: keyof FinanceOverviewExpenseFormValues): boolean =>
            Boolean(touched[fieldName] || submitCount > 0) && Boolean(errors[fieldName]);

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
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Date"
                        name="date"
                        type="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
                        error={shouldShowError('date')}
                        helperText={shouldShowError('date') ? errors.date : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Category"
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('category')}
                        helperText={shouldShowError('category') ? errors.category : undefined}
                      >
                        <MenuItem value="">Select category</MenuItem>
                        {CLINIC_EXPENSE_CATEGORY_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {getClinicExpenseCategoryLabel(option)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Remarks"
                        name="remarks"
                        value={values.remarks}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        multiline
                        minRows={4}
                        placeholder="Example: utility bill, supply order, equipment servicing."
                        error={shouldShowError('remarks')}
                        helperText={shouldShowError('remarks') ? errors.remarks : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Amount"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amount', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('amount')}
                        helperText={shouldShowError('amount') ? errors.amount : undefined}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} color="inherit">
                  Cancel
                </Button>
                <Button onClick={() => handleSubmit()} variant="contained" disabled={isSubmitting}>
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

export default FinanceOverviewExpenseForm;

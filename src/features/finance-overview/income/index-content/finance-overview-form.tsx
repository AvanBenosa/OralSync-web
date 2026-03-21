import { ChangeEvent, FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import PatientList from '../../../PatientList';
import type { PatientModel } from '../../../patient/api/types';
import { GetClinicUsers } from '../../../settings/create-user/api/api';
import type { SettingsUserModel } from '../../../settings/create-user/api/types';
import {
  PROGRESS_NOTE_ACCOUNT_OPTIONS,
  PROGRESS_NOTE_CATEGORY_OPTIONS,
  ProgressNoteAccount,
  ProgressNoteCategory,
} from '../../../patient-profile-modules/progress-note/api/types';
import {
  HandleCreateFinanceIncomeItem,
  HandleUpdateFinanceIncomeItem,
} from '../api/handlers';
import type { FinanceIncomeModel, FinanceIncomeStateProps } from '../api/types';
import { financeIncomeValidationSchema } from '../api/validation';

type FinanceOverviewFormProps = FinanceIncomeStateProps & {
  onSaved?: () => Promise<void> | void;
};

type FinanceOverviewFormValues = {
  id: string;
  patientInfoId: string;
  patientName: string;
  assignedDoctor: string;
  date: string;
  procedure: string;
  category: ProgressNoteCategory | '';
  remarks: string;
  account: ProgressNoteAccount | '';
  amount: number | '';
  discount: number | '';
  totalAmountDue: number | '';
  amountPaid: number | '';
  balance: number | '';
};

const buildPatientName = (patient?: PatientModel): string => {
  if (!patient) {
    return '';
  }

  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (lastName && givenNames) {
    return `${lastName}, ${givenNames}`;
  }

  return lastName || givenNames || patient.patientNumber || '';
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

const createInitialValues = (selectedItem?: FinanceIncomeModel): FinanceOverviewFormValues => ({
  id: selectedItem?.id || '',
  patientInfoId: selectedItem?.patientInfoId || '',
  patientName: selectedItem?.patientName || selectedItem?.patientNumber || '',
  assignedDoctor: selectedItem?.assignedDoctor || '',
  date: toDateInputValue(selectedItem?.date) || getTodayDateInputValue(),
  procedure: selectedItem?.procedure || '',
  category: selectedItem?.category || '',
  remarks: selectedItem?.remarks || '',
  account: selectedItem?.account || '',
  amount: selectedItem?.amount ?? '',
  discount: selectedItem?.discount ?? '',
  totalAmountDue: selectedItem?.totalAmountDue ?? '',
  amountPaid: selectedItem?.amountPaid ?? '',
  balance: selectedItem?.balance ?? '',
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

const FinanceOverviewForm: FunctionComponent<FinanceOverviewFormProps> = (
  props: FinanceOverviewFormProps
): JSX.Element => {
  const { state, setState, clinicId, onSaved } = props;
  const [doctorOptions, setDoctorOptions] = useState<SettingsUserModel[]>([]);
  const [patientSelectionError, setPatientSelectionError] = useState<string>('');

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update Income' : 'Add Income'),
    [state.isUpdate]
  );

  useEffect(() => {
    let isMounted = true;

    void GetClinicUsers()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const filteredUsers = (response.items || []).filter((item) => {
          const normalizedUserName = (item.userName || '').trim().toLowerCase();
          const normalizedEmail = (item.emailAddress || '').trim().toLowerCase();
          const isBootstrapSeed =
            normalizedUserName === 'admin@email.com' || normalizedEmail === 'admin@email.com';

          return !isBootstrapSeed;
        });

        setDoctorOptions(filteredUsers);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setDoctorOptions([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      selectedItem: undefined,
    });
  };

  const handleSubmitForm = async (values: FinanceOverviewFormValues): Promise<void> => {
    const totalAmountDue = getTotalAmountDueValue(values.amount, values.discount);
    const balance = getBalanceValue(totalAmountDue, values.amountPaid);

    const payload = {
      id: values.id.trim() || undefined,
      patientInfoId: values.patientInfoId.trim() || undefined,
      assignedDoctor: values.assignedDoctor || undefined,
      date: toDatePayloadValue(values.date),
      procedure: values.procedure.trim(),
      category: values.category || undefined,
      remarks: values.remarks.trim(),
      account: values.account || undefined,
      amount: getNumericValue(values.amount),
      discount: getNumericValue(values.discount),
      totalAmountDue: getNumericValue(totalAmountDue),
      amountPaid: getNumericValue(values.amountPaid),
      balance: getNumericValue(balance),
    };

    if (state.isUpdate) {
      await HandleUpdateFinanceIncomeItem(payload);
    } else {
      await HandleCreateFinanceIncomeItem(payload);
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
        validationSchema={financeIncomeValidationSchema}
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
              setStatus('Unable to save income record.');
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
          const totalAmountDueValue = getTotalAmountDueValue(values.amount, values.discount);
          const balanceValue = getBalanceValue(totalAmountDueValue, values.amountPaid);
          const shouldShowError = (fieldName: keyof FinanceOverviewFormValues): boolean =>
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
                  {patientSelectionError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {patientSelectionError}
                    </Alert>
                  ) : null}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <PatientList
                        clinicId={clinicId}
                        selectedPatientId={values.patientInfoId}
                        selectedPatientName={values.patientName}
                        error={shouldShowError('patientInfoId')}
                        helperText={
                          shouldShowError('patientInfoId') ? errors.patientInfoId : undefined
                        }
                        onSelect={(patient: PatientModel) => {
                          setPatientSelectionError('');
                          setFieldValue('patientInfoId', String(patient.id ?? ''));
                          setFieldValue('patientName', buildPatientName(patient));
                        }}
                        onClearSelection={() => {
                          setPatientSelectionError('');
                          setFieldValue('patientInfoId', '');
                          setFieldValue('patientName', '');
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
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
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="Procedure"
                        name="procedure"
                        value={values.procedure}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        required
                        error={shouldShowError('procedure')}
                        helperText={shouldShowError('procedure') ? errors.procedure : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Assigned Dentist"
                        name="assignedDoctor"
                        value={values.assignedDoctor}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                      >
                        <MenuItem value="">Select assigned doctor</MenuItem>
                        {doctorOptions.map((option) => {
                          const doctorName = [option.firstName, option.lastName]
                            .map((value) => value?.trim())
                            .filter(Boolean)
                            .join(' ');
                          const doctorDisplayName = doctorName
                            ? `Dr. ${doctorName}`
                            : option.userName || option.emailAddress || 'Unnamed user';

                          return (
                            <MenuItem
                              key={option.id || option.userName || doctorName}
                              value={doctorName || option.userName || option.emailAddress || ''}
                            >
                              {doctorDisplayName}
                            </MenuItem>
                          );
                        })}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        label="Category"
                        name="category"
                        value={values.category}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                        error={shouldShowError('category')}
                        helperText={shouldShowError('category') ? errors.category : undefined}
                      >
                        <MenuItem value="">Select category</MenuItem>
                        {PROGRESS_NOTE_CATEGORY_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
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
                        placeholder="Example: treatment notes, payment context, and follow-up details."
                        error={shouldShowError('remarks')}
                        helperText={shouldShowError('remarks') ? errors.remarks : undefined}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: '#425e79', mb: 1.25 }}
                    >
                      Payment Details
                    </Typography>
                    <Divider />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Account"
                        name="account"
                        value={values.account}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        select
                        fullWidth
                        size="small"
                        error={shouldShowError('account')}
                        helperText={shouldShowError('account') ? errors.account : undefined}
                      >
                        <MenuItem value="">Select account</MenuItem>
                        {PROGRESS_NOTE_ACCOUNT_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Cost"
                        name="amount"
                        type="number"
                        value={values.amount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amount', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('amount')}
                        helperText={shouldShowError('amount') ? errors.amount : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Discount"
                        name="discount"
                        type="number"
                        value={values.discount}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('discount', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('discount')}
                        helperText={shouldShowError('discount') ? errors.discount : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Total Amount Due"
                        name="totalAmountDue"
                        type="number"
                        value={totalAmountDueValue}
                        fullWidth
                        size="small"
                        disabled
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Amount Paid"
                        name="amountPaid"
                        type="number"
                        value={values.amountPaid}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setFieldValue('amountPaid', parseNumberInput(event.target.value))
                        }
                        onBlur={handleBlur}
                        fullWidth
                        size="small"
                        error={shouldShowError('amountPaid')}
                        helperText={shouldShowError('amountPaid') ? errors.amountPaid : undefined}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Balance"
                        name="balance"
                        type="number"
                        value={balanceValue}
                        fullWidth
                        size="small"
                        disabled
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
                  onClick={() => {
                    if (!values.patientInfoId.trim()) {
                      setPatientSelectionError('Please select a patient before saving.');
                    }

                    handleSubmit();
                  }}
                  variant="contained"
                  disabled={isSubmitting}
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

export default FinanceOverviewForm;

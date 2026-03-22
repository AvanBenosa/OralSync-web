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
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';

import { toastConfig } from '../../../../common/api/responses';
import { HandleUpdateClinicLockItem } from '../api/handlers';
import type { ClinicLockStateProps } from '../api/types';
import {
  getClinicContactValue,
  SUBSCRIPTION_OPTIONS,
  toClinicDateInputValue,
} from '../utils';

type ClinicLockFormValues = {
  clinicId: string;
  clinicName: string;
  contact: string;
  subscriptionType: string;
  validityDate: string;
  isLocked: boolean;
};

const createInitialValues = (selectedItem?: ClinicLockStateProps['state']['selectedItem']): ClinicLockFormValues => ({
  clinicId: selectedItem?.id || '',
  clinicName: selectedItem?.clinicName || '--',
  contact: getClinicContactValue(selectedItem),
  subscriptionType: selectedItem?.subscriptionType || '',
  validityDate: toClinicDateInputValue(selectedItem?.validityDate),
  isLocked: Boolean(selectedItem?.isLocked),
});

const ClinicLockModal: FunctionComponent<ClinicLockStateProps> = (
  props: ClinicLockStateProps
): JSX.Element => {
  const { state, setState } = props;
  const dialogTitle = useMemo(() => 'Update Clinic Settings', []);

  const handleClose = (): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      openModal: false,
      isUpdate: false,
      isHistory: false,
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
        initialValues={createInitialValues(state.selectedItem)}
        onSubmit={async (values, { setSubmitting, setStatus }): Promise<void> => {
          setStatus(undefined);

          if (!values.clinicId) {
            setStatus('Clinic was not found.');
            setSubmitting(false);
            return;
          }

          if (!values.subscriptionType.trim()) {
            setStatus('Select a subscription type.');
            setSubmitting(false);
            return;
          }

          if (!values.validityDate.trim()) {
            setStatus('Select a validity date.');
            setSubmitting(false);
            return;
          }

          try {
            await HandleUpdateClinicLockItem(
              {
                clinicId: values.clinicId,
                isLocked: values.isLocked,
                subscriptionType: values.subscriptionType,
                validityDate: values.validityDate,
              },
              setState
            );
            toast.success('Clinic settings have been updated.', toastConfig);
          } catch (error) {
            if (isAxiosError(error)) {
              setStatus(
                typeof error.response?.data === 'string' ? error.response.data : error.message
              );
            } else {
              setStatus('Unable to update clinic settings.');
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue, status }): JSX.Element => (
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
                      label="Clinic Name"
                      fullWidth
                      value={values.clinicName}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Contact"
                      fullWidth
                      value={values.contact}
                      InputProps={{ readOnly: true }}
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
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Validity Date"
                      name="validityDate"
                      type="date"
                      fullWidth
                      value={values.validityDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: '1000-01-01', max: '9999-12-31' }}
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
                        <Typography sx={{ fontWeight: 700, color: '#17344f' }}>
                          Lock Access
                        </Typography>
                        <Typography sx={{ color: '#6a8094', fontSize: '0.84rem' }}>
                          Turn this on to lock the clinic workspace.
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Typography
                          sx={{
                            color: values.isLocked ? '#c62828' : '#156c43',
                            fontWeight: 800,
                          }}
                        >
                          {values.isLocked ? 'Locked' : 'Unlocked'}
                        </Typography>
                        <Switch
                          checked={values.isLocked}
                          color="error"
                          onChange={(_, checked) => {
                            setFieldValue('isLocked', checked);
                          }}
                        />
                      </Box>
                    </Box>
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
                  isSubmitting || !values.subscriptionType.trim() || !values.validityDate.trim()
                }
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </>
  );
};

export default ClinicLockModal;

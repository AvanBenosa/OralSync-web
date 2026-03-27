// TODO: Replace MODULE_NAME, module_name, MODULE_NOUN tokens.
// TODO: Add / remove form sections and fields to match your domain model.

import { FunctionComponent, JSX, useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import { isAxiosError } from 'axios';

import { HandleCreateMODULE_NAME, HandleUpdateMODULE_NAME } from '../api/handlers';
import {
  MODULE_NAME_STATUS_OPTIONS,
  MODULE_NAMEModel,
  MODULE_NAMEStateProps,
  MODULE_NAMEStatus,
  getMODULE_NAMEStatusLabel,
} from '../api/types';
import { module_nameValidationSchema } from '../api/validation';

type MODULE_NAMEFormProps = MODULE_NAMEStateProps;

// ─── Form Value Type ──────────────────────────────────────────────────────────
// Mirror MODULE_NAMEModel but use '' for optional selects and blank dates.

type MODULE_NAMEFormValues = {
  id: string;
  name: string;
  description: string;
  status: MODULE_NAMEStatus | '';
  isActive: boolean;
  // TODO: add more fields here
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createInitialValues = (selectedItem?: MODULE_NAMEModel): MODULE_NAMEFormValues => ({
  id: selectedItem?.id || '',
  name: selectedItem?.name || '',
  description: selectedItem?.description || '',
  status: selectedItem?.status || '',
  isActive: selectedItem?.isActive ?? true,
  // TODO: initialize more fields here
});

// ─── Component ────────────────────────────────────────────────────────────────

const MODULE_NAMEForm: FunctionComponent<MODULE_NAMEFormProps> = (
  props: MODULE_NAMEFormProps
): JSX.Element => {
  const { state, setState } = props;

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Update MODULE_NOUN' : 'Add MODULE_NOUN'),
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

  const handleSubmitForm = async (values: MODULE_NAMEFormValues): Promise<void> => {
    const payload: MODULE_NAMEModel = {
      id: values.id.trim() || undefined,
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status || undefined,
      isActive: values.isActive,
      // TODO: map more fields here
    };

    if (state.isUpdate) {
      await HandleUpdateMODULE_NAME(payload, state, setState);
    } else {
      await HandleCreateMODULE_NAME(payload, state, setState);
    }
  };

  return (
    <>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>{dialogTitle}</DialogTitle>
      <Formik
        enableReinitialize
        validateOnChange={false}
        initialValues={createInitialValues(state.selectedItem)}
        validationSchema={module_nameValidationSchema}
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
              setStatus('Unable to save record.');
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
          const shouldShowError = (fieldName: keyof MODULE_NAMEFormValues): boolean =>
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

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* ── Section 1: Basic Information ───────────────────── */}
                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            label="Name"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('name')}
                            helperText={shouldShowError('name') ? errors.name : undefined}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Status"
                            name="status"
                            value={values.status}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            select
                            fullWidth
                            size="small"
                            required
                            error={shouldShowError('status')}
                            helperText={shouldShowError('status') ? errors.status : undefined}
                          >
                            <MenuItem value="">Select status</MenuItem>
                            {MODULE_NAME_STATUS_OPTIONS.map((option) => (
                              <MenuItem key={option} value={option}>
                                {getMODULE_NAMEStatusLabel(option)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Description"
                            name="description"
                            value={values.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            fullWidth
                            size="small"
                            multiline
                            minRows={3}
                            error={shouldShowError('description')}
                            helperText={
                              shouldShowError('description') ? errors.description : undefined
                            }
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    {/*
                     * TODO: Add more <Box> sections here, each with:
                     *   <Typography> section heading
                     *   <Grid container> with your <TextField> / <MenuItem> fields
                     *   <Divider /> after the section
                     *
                     * Pattern for a plain text field:
                     *   <Grid size={{ xs: 12, sm: 6 }}>
                     *     <TextField
                     *       label="Your Label"
                     *       name="yourField"
                     *       value={values.yourField}
                     *       onChange={handleChange}
                     *       onBlur={handleBlur}
                     *       fullWidth size="small"
                     *       error={shouldShowError('yourField')}
                     *       helperText={shouldShowError('yourField') ? errors.yourField : undefined}
                     *     />
                     *   </Grid>
                     *
                     * Pattern for a number field:
                     *   onChange={(e) => setFieldValue('yourField', parseNumberInput(e.target.value))}
                     *
                     * Pattern for a date field:
                     *   type="date"  InputLabelProps={{ shrink: true }}
                     */}

                    {/* ── Section N: Status ──────────────────────────────── */}
                    <Box>
                      <Typography sx={{ mb: 1.25, fontWeight: 800, color: '#1f4467' }}>
                        Status
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.isActive}
                            onChange={(_, checked) => setFieldValue('isActive', checked)}
                          />
                        }
                        label={values.isActive ? 'Active' : 'Inactive'}
                      />
                    </Box>
                  </Box>
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

export default MODULE_NAMEForm;

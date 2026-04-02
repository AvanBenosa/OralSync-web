import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import { LabProviderFormValues, LabProviderStateProps } from '../api/types';

type LabProviderFormProps = LabProviderStateProps & {
  submitError: string;
  onClose: () => void;
  onSubmit: (values: LabProviderFormValues) => Promise<void>;
  onClearMessages: () => void;
};

const createInitialValues = (): LabProviderFormValues => ({
  id: undefined,
  labName: '',
  contactPerson: '',
  contactNumber: '',
  emailAddress: '',
  labType: '',
});

const toFormValues = (
  isUpdate: boolean,
  values?: Partial<LabProviderFormValues> | null
): LabProviderFormValues =>
  isUpdate
    ? {
        id: values?.id,
        labName: values?.labName || '',
        contactPerson: values?.contactPerson || '',
        contactNumber: values?.contactNumber || '',
        emailAddress: values?.emailAddress || '',
        labType: values?.labType || '',
      }
    : createInitialValues();

const LabProviderForm: FunctionComponent<LabProviderFormProps> = (
  props: LabProviderFormProps
): JSX.Element => {
  const { state, submitError, onClose, onSubmit, onClearMessages } = props;
  const [formValues, setFormValues] = useState<LabProviderFormValues>(createInitialValues);

  useEffect(() => {
    setFormValues(
      toFormValues(state.isUpdate, {
        id: state.selectedItem?.id,
        labName: state.selectedItem?.labName,
        contactPerson: state.selectedItem?.contactPerson,
        contactNumber: state.selectedItem?.contactNumber,
        emailAddress: state.selectedItem?.emailAddress,
        labType: state.selectedItem?.labType,
      })
    );
  }, [
    state.isUpdate,
    state.openModal,
    state.selectedItem?.contactNumber,
    state.selectedItem?.contactPerson,
    state.selectedItem?.emailAddress,
    state.selectedItem?.id,
    state.selectedItem?.labName,
    state.selectedItem?.labType,
  ]);

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Edit Lab Provider' : 'Create Lab Provider'),
    [state.isUpdate]
  );

  const handleFieldChange = (field: keyof LabProviderFormValues, value: string): void => {
    onClearMessages();
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  return (
    <>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Lab Name"
            value={formValues.labName}
            onChange={(event) => handleFieldChange('labName', event.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Lab Type"
            value={formValues.labType}
            onChange={(event) => handleFieldChange('labType', event.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Contact Person"
            value={formValues.contactPerson}
            onChange={(event) => handleFieldChange('contactPerson', event.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Contact Number"
            value={formValues.contactNumber}
            onChange={(event) => handleFieldChange('contactNumber', event.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Email Address"
            type="email"
            value={formValues.emailAddress}
            onChange={(event) => handleFieldChange('emailAddress', event.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void onSubmit(formValues)}>
          {state.isUpdate ? 'Update Lab Provider' : 'Save Lab Provider'}
        </Button>
      </DialogActions>
    </>
  );
};

export default LabProviderForm;

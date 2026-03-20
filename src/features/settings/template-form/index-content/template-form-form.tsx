import { Alert, Button, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import { TemplateFormFormValues, TemplateFormStateProps } from '../api/types';
import TemplateFormEditor from './template-form-editor';

type TemplateFormFormProps = TemplateFormStateProps & {
  submitError: string;
  onClose: () => void;
  onSubmit: (values: TemplateFormFormValues) => Promise<void>;
  onClearMessages: () => void;
};

const createInitialValues = (): TemplateFormFormValues => ({
  id: undefined,
  templateName: '',
  templateContent: '',
  date: null,
});

const toFormValues = (
  isUpdate: boolean,
  templateName?: string,
  templateContent?: string,
  id?: string,
  date?: string | null
): TemplateFormFormValues =>
  isUpdate
    ? {
        id,
        templateName: templateName || '',
        templateContent: templateContent || '',
        date: date || null,
      }
    : createInitialValues();

const TemplateFormForm: FunctionComponent<TemplateFormFormProps> = (
  props: TemplateFormFormProps
): JSX.Element => {
  const { state, submitError, onClose, onSubmit, onClearMessages } = props;
  const [formValues, setFormValues] = useState<TemplateFormFormValues>(createInitialValues);

  useEffect(() => {
    setFormValues(
      toFormValues(
        state.isUpdate,
        state.selectedItem?.templateName,
        state.selectedItem?.templateContent,
        state.selectedItem?.id,
        state.selectedItem?.date
      )
    );
  }, [
    state.isUpdate,
    state.openModal,
    state.selectedItem?.id,
    state.selectedItem?.templateContent,
    state.selectedItem?.templateName,
    state.selectedItem?.date,
  ]);

  const dialogTitle = useMemo(
    () => (state.isUpdate ? 'Edit Template Form' : 'Create Template Form'),
    [state.isUpdate]
  );

  const handleFieldChange = (field: keyof TemplateFormFormValues, value: string): void => {
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
        <TextField
          label="Template Name"
          value={formValues.templateName}
          onChange={(event) => handleFieldChange('templateName', event.target.value)}
          fullWidth
          size="small"
          sx={{ mt: 1 }}
        />
        <TemplateFormEditor
          value={formValues.templateContent}
          onChange={(value) => handleFieldChange('templateContent', value)}
          onFocus={onClearMessages}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void onSubmit(formValues)}>
          {state.isUpdate ? 'Update Template' : 'Save Template'}
        </Button>
      </DialogActions>
    </>
  );
};

export default TemplateFormForm;

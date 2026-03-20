import { Dialog } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useState } from 'react';

import { HandleCreateTemplateForm, HandleUpdateTemplateForm } from './api/handlers';
import { TemplateFormFormValues, TemplateFormModel, TemplateFormStateProps } from './api/types';
import TemplateFormForm from './index-content/template-form-form';
import TemplateFormTable from './index-content/template-form-table';
import TemplateFormDeleteModal from './modal/modal';

const TemplateFormManagement: FunctionComponent<TemplateFormStateProps> = (
  props: TemplateFormStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const clearMessages = (): void => {
    setStatusMessage('');
    setSubmitError('');
  };

  const handleOpenCreate = (): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      openModal: true,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleOpenEdit = (item: TemplateFormModel): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: true,
      isDelete: false,
    }));
  };

  const handleOpenDelete = (item: TemplateFormModel): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: false,
      isDelete: true,
    }));
  };

  const handleCloseDialog = (): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleSubmit = async (values: TemplateFormFormValues): Promise<void> => {
    clearMessages();

    if (!values.templateName.trim()) {
      setSubmitError('Template name is required.');
      return;
    }

    if (!values.templateContent.trim()) {
      setSubmitError('Template content is required.');
      return;
    }

    const request: TemplateFormFormValues = {
      ...values,
      templateName: values.templateName.trim(),
      templateContent: values.templateContent.trim(),
      date: values.date || new Date().toISOString(),
    };

    try {
      if (state.isUpdate && request.id) {
        await HandleUpdateTemplateForm(request, state, setState);
        setStatusMessage('Template form has been updated successfully.');
      } else {
        await HandleCreateTemplateForm(request, state, setState);
        setStatusMessage('Template form has been created successfully.');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update template form.' : 'Unable to create template form.'
        );
      }
    }
  };

  return (
    <>
      <TemplateFormTable
        state={state}
        setState={setState}
        statusMessage={statusMessage}
        submitError={submitError}
        onOpenCreate={handleOpenCreate}
        onOpenEdit={handleOpenEdit}
        onOpenDelete={handleOpenDelete}
        onClearMessages={clearMessages}
      />

      <Dialog
        open={state.openModal}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth={state.isDelete ? 'sm' : 'md'}
      >
        {state.isDelete ? (
          <TemplateFormDeleteModal
            state={state}
            setState={setState}
            onDeleteSuccess={() => setStatusMessage('Template form has been deleted successfully.')}
          />
        ) : (
          <TemplateFormForm
            state={state}
            setState={setState}
            submitError={submitError}
            onClose={handleCloseDialog}
            onSubmit={handleSubmit}
            onClearMessages={clearMessages}
          />
        )}
      </Dialog>
    </>
  );
};

export default TemplateFormManagement;

import { Dialog } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import { HandleCreateTemplateForm, HandleUpdateTemplateForm } from './api/handlers';
import {
  getTemplateItemKey,
  getTemplateTypeContent,
  isTemplateOfType,
  TemplateFormFormValues,
  TemplateFormModel,
  TemplateFormStateProps,
  TemplateType,
} from './api/types';
import TemplateFormForm from './index-content/template-form-form';
import TemplateFormTable from './index-content/template-form-table';
import TemplateFormDeleteModal from './modal/modal';

type TemplateFormManagementProps = TemplateFormStateProps & {
  templateType: TemplateType;
};

const TemplateFormManagement: FunctionComponent<TemplateFormManagementProps> = (
  props: TemplateFormManagementProps
): JSX.Element => {
  const { state, setState, templateType } = props;
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const templateTypeContent = useMemo(() => getTemplateTypeContent(templateType), [templateType]);
  const filteredItems = useMemo(
    () => state.items.filter((item) => isTemplateOfType(item, templateType)),
    [state.items, templateType]
  );
  const selectedItem = useMemo(
    () => (isTemplateOfType(state.selectedItem, templateType) ? state.selectedItem : null),
    [state.selectedItem, templateType]
  );

  const clearMessages = (): void => {
    setStatusMessage('');
    setSubmitError('');
  };

  useEffect(() => {
    if (state.openModal || state.load) {
      return;
    }

    const selectedItemStillExists = selectedItem
      ? filteredItems.some((item) => getTemplateItemKey(item) === getTemplateItemKey(selectedItem))
      : false;

    if (selectedItemStillExists) {
      return;
    }

    const nextSelectedItem = filteredItems[0] || null;

    if (
      getTemplateItemKey(nextSelectedItem) === getTemplateItemKey(state.selectedItem) &&
      Boolean(nextSelectedItem) === Boolean(state.selectedItem)
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedItem: nextSelectedItem,
    }));
  }, [filteredItems, selectedItem, setState, state.load, state.openModal, state.selectedItem]);

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
      type: templateType,
    };

    try {
      if (state.isUpdate && request.id) {
        await HandleUpdateTemplateForm(request, state, setState);
        setStatusMessage(templateTypeContent.updateSuccessMessage);
      } else {
        await HandleCreateTemplateForm(request, state, setState);
        setStatusMessage(templateTypeContent.createSuccessMessage);
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate
            ? templateTypeContent.updateErrorMessage
            : templateTypeContent.createErrorMessage
        );
      }
    }
  };

  return (
    <>
      <TemplateFormTable
        state={state}
        setState={setState}
        templateType={templateType}
        items={filteredItems}
        selectedItem={selectedItem}
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
            templateType={templateType}
            onDeleteSuccess={() => setStatusMessage(templateTypeContent.deleteSuccessMessage)}
          />
        ) : (
          <TemplateFormForm
            state={state}
            setState={setState}
            templateType={templateType}
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

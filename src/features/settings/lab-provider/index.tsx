import { Dialog } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import { HandleCreateLabProvider, HandleUpdateLabProvider } from './api/handlers';
import {
  getLabProviderItemKey,
  LabProviderFormValues,
  LabProviderModel,
  LabProviderStateProps,
} from './api/types';
import LabProviderForm from './index-content/lab-provider-form';
import LabProviderTable from './index-content/lab-provider-table';
import LabProviderDeleteModal from './modal/modal';

const LabProviderManagement: FunctionComponent<LabProviderStateProps> = (
  props: LabProviderStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const sortedItems = useMemo(
    () =>
      [...state.items].sort((leftItem, rightItem) =>
        (leftItem.labName || '').localeCompare(rightItem.labName || '')
      ),
    [state.items]
  );

  const selectedItem = useMemo(
    () =>
      sortedItems.find(
        (item) => getLabProviderItemKey(item) === getLabProviderItemKey(state.selectedItem)
      ) || null,
    [sortedItems, state.selectedItem]
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
      ? sortedItems.some(
          (item) => getLabProviderItemKey(item) === getLabProviderItemKey(selectedItem)
        )
      : false;

    if (selectedItemStillExists) {
      return;
    }

    const nextSelectedItem = sortedItems[0] || null;

    if (
      getLabProviderItemKey(nextSelectedItem) === getLabProviderItemKey(state.selectedItem) &&
      Boolean(nextSelectedItem) === Boolean(state.selectedItem)
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedItem: nextSelectedItem,
    }));
  }, [selectedItem, setState, sortedItems, state.load, state.openModal, state.selectedItem]);

  const handleOpenCreate = (): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      openModal: true,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleOpenEdit = (item: LabProviderModel): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: true,
      isDelete: false,
    }));
  };

  const handleOpenDelete = (item: LabProviderModel): void => {
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

  const handleSubmit = async (values: LabProviderFormValues): Promise<void> => {
    clearMessages();

    if (!values.labName.trim()) {
      setSubmitError('Lab provider name is required.');
      return;
    }

    const request: LabProviderFormValues = {
      ...values,
      labName: values.labName.trim(),
      labType: values.labType.trim(),
      contactPerson: values.contactPerson.trim(),
      contactNumber: values.contactNumber.trim(),
      emailAddress: values.emailAddress.trim(),
    };

    try {
      if (state.isUpdate && request.id) {
        await HandleUpdateLabProvider(request, state, setState);
        setStatusMessage('Lab provider has been updated successfully.');
      } else {
        await HandleCreateLabProvider(request, state, setState);
        setStatusMessage('Lab provider has been created successfully.');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update lab provider.' : 'Unable to create lab provider.'
        );
      }
    }
  };

  return (
    <>
      <LabProviderTable
        state={state}
        setState={setState}
        items={sortedItems}
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
          <LabProviderDeleteModal
            state={state}
            setState={setState}
            onDeleteSuccess={() => setStatusMessage('Lab provider has been deleted successfully.')}
          />
        ) : (
          <LabProviderForm
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

export default LabProviderManagement;

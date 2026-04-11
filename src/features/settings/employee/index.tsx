import { Dialog } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useEffect, useMemo, useState } from 'react';

import { HandleCreateEmployee, HandleUpdateEmployee } from './api/handlers';
import {
  EmployeeFormValues,
  EmployeeModel,
  EmployeeRole,
  EmployeeStateProps,
  getEmployeeItemKey,
} from './api/types';
import EmployeeForm from './index-content/employee-form';
import EmployeeTable from './index-content/employee-table';
import EmployeeDeleteModal from './modal/modal';

const EmployeeManagement: FunctionComponent<EmployeeStateProps> = (
  props: EmployeeStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const sortedItems = useMemo(
    () =>
      [...state.items].sort((leftItem, rightItem) =>
        `${leftItem.lastName || ''} ${leftItem.firstName || ''}`.localeCompare(
          `${rightItem.lastName || ''} ${rightItem.firstName || ''}`
        )
      ),
    [state.items]
  );

  const selectedItem = useMemo(
    () =>
      sortedItems.find(
        (item) => getEmployeeItemKey(item) === getEmployeeItemKey(state.selectedItem)
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
      ? sortedItems.some((item) => getEmployeeItemKey(item) === getEmployeeItemKey(selectedItem))
      : false;

    if (selectedItemStillExists) {
      return;
    }

    const nextSelectedItem = sortedItems[0] || null;

    if (
      getEmployeeItemKey(nextSelectedItem) === getEmployeeItemKey(state.selectedItem) &&
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

  const handleOpenEdit = (item: EmployeeModel): void => {
    clearMessages();
    setState((prev) => ({
      ...prev,
      selectedItem: item,
      openModal: true,
      isUpdate: true,
      isDelete: false,
    }));
  };

  const handleOpenDelete = (item: EmployeeModel): void => {
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

  const handleSubmit = async (values: EmployeeFormValues): Promise<void> => {
    clearMessages();

    if (!values.firstName.trim()) {
      setSubmitError('Employee first name is required.');
      return;
    }

    if (!values.lastName.trim()) {
      setSubmitError('Employee last name is required.');
      return;
    }

    if (values.role === EmployeeRole.None) {
      setSubmitError('Employee role is required.');
      return;
    }

    const request: EmployeeFormValues = {
      ...values,
      profilePicture: values.profilePicture.trim(),
      emailAddress: values.emailAddress.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName.trim(),
      contactNumber: values.contactNumber.trim(),
      address: values.address.trim(),
    };

    try {
      if (state.isUpdate && request.id) {
        await HandleUpdateEmployee(request, state, setState);
        setStatusMessage('Employee has been updated successfully.');
      } else {
        await HandleCreateEmployee(request, state, setState);
        setStatusMessage('Employee has been created successfully.');
      }
    } catch (error) {
      if (isAxiosError(error)) {
        setSubmitError(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setSubmitError(
          state.isUpdate ? 'Unable to update employee.' : 'Unable to create employee.'
        );
      }
    }
  };

  return (
    <>
      <EmployeeTable
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
          <EmployeeDeleteModal
            state={state}
            setState={setState}
            onDeleteSuccess={() => setStatusMessage('Employee has been deleted successfully.')}
          />
        ) : (
          <EmployeeForm
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

export default EmployeeManagement;

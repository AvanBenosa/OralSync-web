import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useMemo, useState } from 'react';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteEmployee } from '../api/handlers';
import { EmployeeStateProps } from '../api/types';

type EmployeeDeleteModalProps = EmployeeStateProps & {
  onDeleteSuccess: () => void;
};

const getEmployeeLabel = (firstName?: string, lastName?: string): string =>
  [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || 'this employee';

const EmployeeDeleteModal: FunctionComponent<EmployeeDeleteModalProps> = (
  props: EmployeeDeleteModalProps
): JSX.Element => {
  const { state, setState, onDeleteSuccess } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const employeeLabel = useMemo(
    () => getEmployeeLabel(state.selectedItem?.firstName, state.selectedItem?.lastName),
    [state.selectedItem?.firstName, state.selectedItem?.lastName]
  );

  const handleClose = (): void => {
    setErrorMessage('');
    setState((prev) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem?.id) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeleteEmployee(state.selectedItem.id, state, setState);
      onDeleteSuccess();
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete employee.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Employee"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{employeeLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default EmployeeDeleteModal;

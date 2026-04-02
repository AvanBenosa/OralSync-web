import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { FunctionComponent, JSX, useMemo, useState } from 'react';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteLabProvider } from '../api/handlers';
import { LabProviderStateProps } from '../api/types';

type LabProviderDeleteModalProps = LabProviderStateProps & {
  onDeleteSuccess: () => void;
};

const getLabProviderLabel = (labName?: string): string => labName?.trim() || 'this lab provider';

const LabProviderDeleteModal: FunctionComponent<LabProviderDeleteModalProps> = (
  props: LabProviderDeleteModalProps
): JSX.Element => {
  const { state, setState, onDeleteSuccess } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const labProviderLabel = useMemo(
    () => getLabProviderLabel(state.selectedItem?.labName),
    [state.selectedItem?.labName]
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
      await HandleDeleteLabProvider(state.selectedItem.id, state, setState);
      onDeleteSuccess();
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete lab provider.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Lab Provider"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{labProviderLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default LabProviderDeleteModal;

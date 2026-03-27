// TODO: Replace MODULE_NAME, module_name, MODULE_NOUN tokens.

import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import { HandleDeleteMODULE_NAME } from '../api/handlers';
import { MODULE_NAMEModel, MODULE_NAMEStateProps } from '../api/types';
import DeleteConfirmModalContent from '../../../modal/modal';

// TODO: update this to return a meaningful display label for your record
const formatLabel = (item?: MODULE_NAMEModel): string => {
  if (!item) return 'this record';
  return item.name?.trim() || 'this record';
};

const MODULE_NAMEDeleteModal: FunctionComponent<MODULE_NAMEStateProps> = (
  props: MODULE_NAMEStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const label = useMemo(() => formatLabel(state.selectedItem), [state.selectedItem]);

  const handleClose = (): void => {
    setState({ ...state, openModal: false });
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem) {
      handleClose();
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await HandleDeleteMODULE_NAME(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete MODULE_NOUN Record" // TODO: update title
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{label}</strong>? This action cannot be undone.
        </Typography>
      }
    />
  );
};

export default MODULE_NAMEDeleteModal;

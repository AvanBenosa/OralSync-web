import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import {
  HandleDeletePatientUploadItem,
  HandleDeletePatientUploadItems,
} from '../api/uploads-handlers';
import { PatientUploadStateProps } from '../api/types';

const getUploadLabel = (fileName?: string): string => fileName?.trim() || 'this upload';

const PatientUploadDeleteModal: FunctionComponent<PatientUploadStateProps> = (
  props: PatientUploadStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const selectedUploads = useMemo(
    () =>
      state.items.filter((item) => item.id && state.selectedUploadIds.includes(item.id)),
    [state.items, state.selectedUploadIds]
  );
  const isBulkDelete = selectedUploads.length > 0;

  const uploadLabel = useMemo(
    () => getUploadLabel(state.selectedItem?.originalFileName || state.selectedItem?.fileName),
    [state.selectedItem?.originalFileName, state.selectedItem?.fileName]
  );

  const handleClose = (): void => {
    setErrorMessage('');
    setState((prev: typeof state) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.patientId?.trim()) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isBulkDelete) {
        await HandleDeletePatientUploadItems(
          selectedUploads.map((item) => ({
            id: item.id,
            patientInfoId: state.patientId,
          })),
          state,
          setState
        );
        return;
      }

      if (!state.selectedItem?.id) {
        handleClose();
        return;
      }

      await HandleDeletePatientUploadItem(
        {
          id: state.selectedItem.id,
          patientInfoId: state.patientId,
        },
        state,
        setState
      );
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete upload.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Upload"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        isBulkDelete ? (
          <Typography component="span" sx={{ color: '#415c74' }}>
            Are you sure you want to delete <strong>{selectedUploads.length}</strong> selected
            upload{selectedUploads.length === 1 ? '' : 's'}? This action cannot be undone.
          </Typography>
        ) : (
          <Typography component="span" sx={{ color: '#415c74' }}>
            Are you sure you want to delete <strong>{uploadLabel}</strong>? This action cannot be
            undone.
          </Typography>
        )
      }
    />
  );
};

export default PatientUploadDeleteModal;

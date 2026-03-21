import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import { PatientProgressNoteModel, PatientProgressNoteStateProps } from '../api/types';
import { HandleDeletePatientProgressNoteItem } from '../api/handlers';

const formatProgressNoteLabel = (item?: PatientProgressNoteModel): string => {
  if (!item) {
    return 'this progress note';
  }

  if (item.procedure?.trim()) {
    return item.procedure.trim();
  }

  if (item.date) {
    return toValidDateDisplay(item.date, 'MMM DD, YYYY', 'this progress note');
  }

  return 'this progress note';
};

const PatientProgressNoteDeleteModal: FunctionComponent<PatientProgressNoteStateProps> = (
  props: PatientProgressNoteStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const progressNoteLabel = useMemo(
    () => formatProgressNoteLabel(state.selectedItem),
    [state.selectedItem]
  );

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeletePatientProgressNoteItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete progress note.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Progress Note"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{progressNoteLabel}</strong>? This action cannot
          be undone.
        </Typography>
      }
    />
  );
};

export default PatientProgressNoteDeleteModal;

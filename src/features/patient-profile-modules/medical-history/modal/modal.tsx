import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import { PatientMedicalHistoryModel, PatientMedicalHistoryStateProps } from '../api/types';
import { HandleDeletePatientMedicalHistoryItem } from '../api/handlers';

const formatMedicalHistoryLabel = (item?: PatientMedicalHistoryModel): string => {
  if (!item) {
    return 'this medical history record';
  }

  if (item.date) {
    return toValidDateDisplay(item.date, 'MMM DD, YYYY', 'this medical history record');
  }

  return 'this medical history record';
};

const PatientMedicalHistoryDeleteModal: FunctionComponent<PatientMedicalHistoryStateProps> = (
  props: PatientMedicalHistoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const medicalHistoryLabel = useMemo(
    () => formatMedicalHistoryLabel(state.selectedItem),
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
      await HandleDeletePatientMedicalHistoryItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete medical history record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Medical History"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{medicalHistoryLabel}</strong>? This action cannot
          be undone.
        </Typography>
      }
    />
  );
};

export default PatientMedicalHistoryDeleteModal;

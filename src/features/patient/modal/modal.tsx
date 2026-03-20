import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../common/modal/modal';
import { PatientModel, PatientStateProps } from '../api/types';
import { HandleDeletePatient } from '../api/handlers';

const formatPatientName = (patient?: PatientModel): string => {
  if (!patient) {
    return 'this patient';
  }

  const lastName = patient.lastName?.trim();
  const givenNames = [patient.firstName, patient.middleName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  if (lastName && givenNames) {
    return `${lastName}, ${givenNames}`;
  }

  if (lastName) {
    return lastName;
  }

  if (givenNames) {
    return givenNames;
  }

  if (patient.patientNumber?.trim()) {
    return patient.patientNumber.trim();
  }

  return 'this patient';
};

const PatientDeleteModal: FunctionComponent<PatientStateProps> = (
  props: PatientStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const patientLabel = useMemo(() => formatPatientName(state.selectedItem), [state.selectedItem]);

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
      await HandleDeletePatient(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete patient record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Patient Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{patientLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default PatientDeleteModal;

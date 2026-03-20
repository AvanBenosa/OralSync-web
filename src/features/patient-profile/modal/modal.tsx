import { FunctionComponent, JSX, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import DeleteConfirmModalContent from '../../../common/modal/modal';
import { PatientProfileStateProps } from '../api/types';
import { HandleDeletePatientProfile } from '../api/handlers';

const PatientProfileDeleteModal: FunctionComponent<PatientProfileStateProps> = (
  props: PatientProfileStateProps
): JSX.Element => {
  const { state, setState } = props;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleClose = (): void => {
    setState({
      ...state,
      openModal: false,
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.patientId && !state.profile?.id) {
      setErrorMessage('Patient ID is missing.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeletePatientProfile(state, setState);
      navigate('/patient');
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
          Are you sure you want to delete <strong>{state.profile?.firstName}</strong>? This action
          cannot be undone.
        </Typography>
      }
    />
  );
};

export default PatientProfileDeleteModal;

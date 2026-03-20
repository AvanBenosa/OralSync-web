import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { AppointmentModel, AppointmentStateProps } from '../api/types';
import { HandleDeleteAppointment } from '../api/handlers';

const formatAppointmentLabel = (item?: AppointmentModel): string => {
  if (!item) {
    return 'this appointment';
  }

  const patientName = item.patientName?.trim();
  const reason = item.reasonForVisit?.trim();

  if (patientName && reason) {
    return `${patientName} - ${reason}`;
  }

  return patientName || reason || 'this appointment';
};

const AppointmentDeleteModal: FunctionComponent<AppointmentStateProps> = (
  props: AppointmentStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const appointmentLabel = useMemo(
    () => formatAppointmentLabel(state.selectedItem),
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
      await HandleDeleteAppointment(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete appointment record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Appointment"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{appointmentLabel}</strong>? This action cannot
          be undone.
        </Typography>
      }
    />
  );
};

export default AppointmentDeleteModal;

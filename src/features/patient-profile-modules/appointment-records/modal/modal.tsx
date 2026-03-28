import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeletePatientAppointmentRecordItem } from '../api/handlers';
import {
  PatientAppointmentRecordModel,
  PatientAppointmentRecordStateProps,
} from '../api/types';

const formatAppointmentRecordLabel = (item?: PatientAppointmentRecordModel): string => {
  if (!item) {
    return 'this appointment record';
  }

  const reason = item.reasonForVisit?.trim();
  const appointmentDate = item.appointmentDateFrom
    ? new Date(item.appointmentDateFrom)
    : undefined;

  if (reason && appointmentDate && !Number.isNaN(appointmentDate.getTime())) {
    return `${reason} on ${appointmentDate.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return reason || 'this appointment record';
};

const PatientAppointmentRecordsDeleteModal: FunctionComponent<
  PatientAppointmentRecordStateProps
> = (props: PatientAppointmentRecordStateProps): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const appointmentRecordLabel = useMemo(
    () => formatAppointmentRecordLabel(state.selectedItem),
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
      await HandleDeletePatientAppointmentRecordItem(state.selectedItem, state, setState);
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
      title="Delete Appointment Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{appointmentRecordLabel}</strong>? This action
          cannot be undone.
        </Typography>
      }
    />
  );
};

export default PatientAppointmentRecordsDeleteModal;

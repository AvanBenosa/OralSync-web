import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import { PatientOverViewModel, PatientOverViewStateProps } from '../api/types';
import { HandleDeletePatientOverViewItem } from '../api/handlers';

const formatOverviewLabel = (item?: PatientOverViewModel): string => {
  if (!item) {
    return 'this overview record';
  }

  if (item.procedure?.trim()) {
    return item.procedure.trim();
  }

  if (item.date) {
    return toValidDateDisplay(item.date, 'MMM DD, YYYY', 'this overview record');
  }

  return 'this overview record';
};

const OverViewDeleteModal: FunctionComponent<PatientOverViewStateProps> = (
  props: PatientOverViewStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const overviewLabel = useMemo(
    () => formatOverviewLabel(state.selectedItem),
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
      await HandleDeletePatientOverViewItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete overview record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Overview Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{overviewLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default OverViewDeleteModal;

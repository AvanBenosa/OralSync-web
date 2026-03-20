import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeletePatientFormItem } from '../api/handlers';
import { PatientFormModel, PatientFormStateProps } from '../api/types';

const formatPatientFormLabel = (item?: PatientFormModel): string => {
  if (item?.formType?.trim()) {
    return item.formType.trim();
  }

  return 'this patient form';
};

const PatientFormsDeleteModal: FunctionComponent<PatientFormStateProps> = (
  props: PatientFormStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const patientFormLabel = useMemo(
    () => formatPatientFormLabel(state.selectedItem),
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
      await HandleDeletePatientFormItem(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete patient form.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Patient Form"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{patientFormLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default PatientFormsDeleteModal;

import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../common/modal/modal';
import { HandleDeleteDentalLabCase } from '../api/handlers';
import { DentalLabCaseModel, DentalLabCaseStateProps } from '../api/types';

const formatLabCaseLabel = (item?: DentalLabCaseModel): string => {
  if (!item) {
    return 'this lab case';
  }

  if (item.caseNumber?.trim()) {
    return `${item.caseNumber} - ${item.patientLabel || 'Unnamed patient'}`;
  }

  return item.patientLabel?.trim() || 'this lab case';
};

const DentalLabCasesDeleteModal: FunctionComponent<DentalLabCaseStateProps> = (
  props: DentalLabCaseStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const caseLabel = useMemo(() => formatLabCaseLabel(state.selectedItem), [state.selectedItem]);

  const handleClose = (): void => {
    setState((prev) => ({
      ...prev,
      openModal: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeleteDentalLabCase(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete lab case.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Dental Lab Case"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{caseLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default DentalLabCasesDeleteModal;

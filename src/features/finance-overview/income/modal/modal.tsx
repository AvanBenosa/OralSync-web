import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import { HandleDeleteFinanceIncomeItem } from '../api/handlers';
import type { FinanceIncomeModel, FinanceIncomeStateProps } from '../api/types';

type FinanceOverviewDeleteModalProps = FinanceIncomeStateProps & {
  onDeleted?: () => Promise<void> | void;
};

const formatIncomeLabel = (item?: FinanceIncomeModel): string => {
  if (!item) {
    return 'this income record';
  }

  const patientName = item.patientName?.trim();
  const procedure = item.procedure?.trim();

  if (patientName && procedure) {
    return `${patientName} - ${procedure}`;
  }

  if (procedure) {
    return procedure;
  }

  if (patientName) {
    return patientName;
  }

  if (item.date) {
    return toValidDateDisplay(item.date, 'MMM DD, YYYY', 'this income record');
  }

  return 'this income record';
};

const FinanceOverviewDeleteModal: FunctionComponent<FinanceOverviewDeleteModalProps> = (
  props: FinanceOverviewDeleteModalProps
): JSX.Element => {
  const { state, setState, onDeleted } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const incomeLabel = useMemo(() => formatIncomeLabel(state.selectedItem), [state.selectedItem]);

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
      await HandleDeleteFinanceIncomeItem(state.selectedItem, state, setState);
      await onDeleted?.();
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete income record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Income Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{incomeLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default FinanceOverviewDeleteModal;

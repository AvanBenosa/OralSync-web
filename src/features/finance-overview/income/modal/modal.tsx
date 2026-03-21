import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteFinanceIncomeItem } from '../api/handlers';
import type { FinanceIncomeModel, FinanceIncomeStateProps } from '../api/types';

type FinanceOverviewDeleteModalProps = FinanceIncomeStateProps & {
  onDeleted?: () => Promise<void> | void;
};

const parseDateValue = (value?: string | Date): Date | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
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
    const date = parseDateValue(item.date);
    if (date) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(date);
    }
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

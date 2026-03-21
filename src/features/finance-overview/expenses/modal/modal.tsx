import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteFinanceExpenseItem } from '../api/handlers';
import {
  FinanceExpenseModel,
  FinanceExpenseStateProps,
  getClinicExpenseCategoryLabel,
} from '../api/types';

type FinanceOverviewExpenseDeleteModalProps = FinanceExpenseStateProps & {
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

const formatExpenseLabel = (item?: FinanceExpenseModel): string => {
  if (!item) {
    return 'this expense record';
  }

  const category = getClinicExpenseCategoryLabel(item.category);
  const remarks = item.remarks?.trim();

  if (remarks) {
    return `${category} - ${remarks}`;
  }

  if (item.date) {
    const date = parseDateValue(item.date);
    if (date) {
      return `${category} - ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(date)}`;
    }
  }

  return category;
};

const FinanceOverviewExpenseDeleteModal: FunctionComponent<
  FinanceOverviewExpenseDeleteModalProps
> = (props: FinanceOverviewExpenseDeleteModalProps): JSX.Element => {
  const { state, setState, onDeleted } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const expenseLabel = useMemo(() => formatExpenseLabel(state.selectedItem), [state.selectedItem]);

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
      await HandleDeleteFinanceExpenseItem(state.selectedItem);
      setState((prevState: typeof state) => ({
        ...prevState,
        openModal: false,
        isUpdate: false,
        isDelete: false,
        selectedItem: undefined,
      }));
      await onDeleted?.();
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete expense record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Expense Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{expenseLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default FinanceOverviewExpenseDeleteModal;

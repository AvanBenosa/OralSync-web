import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { toValidDateDisplay } from '../../../../common/helpers/toValidateDateDisplay';
import { HandleDeleteFinanceExpenseItem } from '../api/handlers';
import {
  FinanceExpenseModel,
  FinanceExpenseStateProps,
  getClinicExpenseCategoryLabel,
} from '../api/types';

type FinanceOverviewExpenseDeleteModalProps = FinanceExpenseStateProps & {
  onDeleted?: () => Promise<void> | void;
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
    return `${category} - ${toValidDateDisplay(item.date, 'MMM DD, YYYY', category)}`;
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
      await HandleDeleteFinanceExpenseItem(state.selectedItem, state, setState);
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

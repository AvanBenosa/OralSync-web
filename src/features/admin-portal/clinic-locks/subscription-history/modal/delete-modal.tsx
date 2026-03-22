import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';

import DeleteConfirmModalContent from '../../../../../common/modal/modal';
import { toastConfig } from '../../../../../common/api/responses';
import { HandleDeleteClinicSubscriptionHistoryItem } from '../api/handlers';
import type { SubscriptionHistoryStateProps } from '../api/types';
import {
  formatSubscriptionHistoryDate,
  formatSubscriptionHistoryType,
} from '../utils';

const formatHistoryLabel = (
  paymentDate?: string | Date,
  subscriptionType?: string
): string =>
  `${formatSubscriptionHistoryDate(paymentDate)} - ${formatSubscriptionHistoryType(subscriptionType)}`;

const SubscriptionHistoryDeleteModal: FunctionComponent<SubscriptionHistoryStateProps> = (
  props: SubscriptionHistoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const historyLabel = useMemo(
    () =>
      formatHistoryLabel(state.selectedItem?.paymentDate, state.selectedItem?.subscriptionType),
    [state.selectedItem?.paymentDate, state.selectedItem?.subscriptionType]
  );

  const handleClose = (): void => {
    setState((prevState: typeof state) => ({
      ...prevState,
      openModal: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem?.id || !state.clinic?.id) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeleteClinicSubscriptionHistoryItem(
        {
          id: state.selectedItem.id,
          clinicId: state.clinic.id,
        },
        setState
      );
      toast.success('Subscription history has been deleted.', toastConfig);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete subscription history record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Subscription History"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{historyLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default SubscriptionHistoryDeleteModal;

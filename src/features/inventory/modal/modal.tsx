import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../common/modal/modal';
import { HandleDeleteInventory } from '../api/handlers';
import { InventoryModel, InventoryStateProps } from '../api/types';

const formatInventoryLabel = (item?: InventoryModel): string => {
  if (!item) {
    return 'this inventory record';
  }

  if (item.itemCode?.trim()) {
    return `${item.itemCode} - ${item.name || 'Unnamed item'}`;
  }

  return item.name?.trim() || 'this inventory record';
};

const InventoryDeleteModal: FunctionComponent<InventoryStateProps> = (
  props: InventoryStateProps
): JSX.Element => {
  const { state, setState } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const inventoryLabel = useMemo(
    () => formatInventoryLabel(state.selectedItem),
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
      await HandleDeleteInventory(state.selectedItem, state, setState);
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete inventory record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Inventory Record"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{inventoryLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default InventoryDeleteModal;

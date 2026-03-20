import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteTemplateForm } from '../api/handlers';
import { TemplateFormModel, TemplateFormStateProps } from '../api/types';

type TemplateFormDeleteModalProps = TemplateFormStateProps & {
  onDeleteSuccess: () => void;
};

const formatTemplateName = (template?: TemplateFormModel | null): string => {
  if (template?.templateName?.trim()) {
    return template.templateName.trim();
  }

  return 'this template form';
};

const TemplateFormDeleteModal: FunctionComponent<TemplateFormDeleteModalProps> = (
  props: TemplateFormDeleteModalProps
): JSX.Element => {
  const { state, setState, onDeleteSuccess } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const templateLabel = useMemo(() => formatTemplateName(state.selectedItem), [state.selectedItem]);

  const handleClose = (): void => {
    setErrorMessage('');
    setState((prev) => ({
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    }));
  };

  const handleDelete = async (): Promise<void> => {
    if (!state.selectedItem?.id) {
      handleClose();
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await HandleDeleteTemplateForm(state.selectedItem.id, state, setState);
      onDeleteSuccess();
    } catch (error) {
      if (isAxiosError(error)) {
        setErrorMessage(
          typeof error.response?.data === 'string' ? error.response.data : error.message
        );
      } else {
        setErrorMessage('Unable to delete template form.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title="Delete Template Form"
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      onConfirm={handleDelete}
      message={
        <Typography component="span" sx={{ color: '#415c74' }}>
          Are you sure you want to delete <strong>{templateLabel}</strong>? This action cannot be
          undone.
        </Typography>
      }
    />
  );
};

export default TemplateFormDeleteModal;

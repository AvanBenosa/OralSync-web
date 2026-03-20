import { FunctionComponent, JSX, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import DeleteConfirmModalContent from '../../../../common/modal/modal';
import { HandleDeleteTemplateForm } from '../api/handlers';
import {
  getTemplateTypeContent,
  TemplateFormModel,
  TemplateFormStateProps,
  TemplateType,
} from '../api/types';

type TemplateFormDeleteModalProps = TemplateFormStateProps & {
  templateType: TemplateType;
  onDeleteSuccess: () => void;
};

const formatTemplateName = (
  templateType: TemplateType,
  template?: TemplateFormModel | null
): string => {
  if (template?.templateName?.trim()) {
    return template.templateName.trim();
  }

  return getTemplateTypeContent(templateType).deleteFallbackLabel;
};

const TemplateFormDeleteModal: FunctionComponent<TemplateFormDeleteModalProps> = (
  props: TemplateFormDeleteModalProps
): JSX.Element => {
  const { state, setState, templateType, onDeleteSuccess } = props;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const templateTypeContent = useMemo(() => getTemplateTypeContent(templateType), [templateType]);

  const templateLabel = useMemo(
    () => formatTemplateName(templateType, state.selectedItem),
    [state.selectedItem, templateType]
  );

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
        setErrorMessage(templateTypeContent.deleteErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DeleteConfirmModalContent
      title={templateTypeContent.deleteTitle}
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

import type { Dispatch, SetStateAction } from 'react';

export enum TemplateType {
  Form = 0,
  Email = 1,
  Sms = 2,
}

export type TemplateTypeContent = {
  singularLabel: string;
  pluralLabel: string;
  listTitle: string;
  listDescription: string;
  previewTitle: string;
  previewDescription: string;
  loadingTitle: string;
  loadingText: string;
  emptyTitle: string;
  emptyText: string;
  previewEmptyTitle: string;
  previewEmptyText: string;
  addButtonLabel: string;
  createTitle: string;
  editTitle: string;
  deleteTitle: string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteSuccessMessage: string;
  createErrorMessage: string;
  updateErrorMessage: string;
  deleteErrorMessage: string;
  deleteFallbackLabel: string;
};

export type TemplateFormModel = {
  id?: string;
  clinicProfileId?: string | null;
  templateName?: string;
  templateContent?: string;
  date?: string | null;
  type?: TemplateType | null;
};

export type TemplateFormResponseModel = {
  items: TemplateFormModel[];
  totalCount: number;
};

export type TemplateFormFormValues = {
  id?: string;
  templateName: string;
  templateContent: string;
  date?: string | null;
  type?: TemplateType;
};

export type TemplateFormStateModel = {
  items: TemplateFormModel[];
  selectedItem: TemplateFormModel | null;
  load: boolean;
  totalItem: number;
  clinicId?: string | null;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
};

export type TemplateFormStateProps = {
  state: TemplateFormStateModel;
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>;
};

export const TEMPLATE_TYPE_CONTENT: Record<TemplateType, TemplateTypeContent> = {
  [TemplateType.Form]: {
    singularLabel: 'template form',
    pluralLabel: 'template forms',
    listTitle: 'Template Forms',
    listDescription: 'Manage reusable clinic form templates and preview their content before use.',
    previewTitle: 'Template Preview',
    previewDescription: 'Review the selected template content exactly as it will be shown.',
    loadingTitle: 'Loading templates',
    loadingText: 'Fetching template forms from your clinic settings.',
    emptyTitle: 'No template forms',
    emptyText: 'Create your first template from the add button above.',
    previewEmptyTitle: 'No template selected',
    previewEmptyText: 'Choose a template from the left panel to preview it here.',
    addButtonLabel: 'Add Template',
    createTitle: 'Create Template Form',
    editTitle: 'Edit Template Form',
    deleteTitle: 'Delete Template Form',
    createSuccessMessage: 'Template form has been created successfully.',
    updateSuccessMessage: 'Template form has been updated successfully.',
    deleteSuccessMessage: 'Template form has been deleted successfully.',
    createErrorMessage: 'Unable to create template form.',
    updateErrorMessage: 'Unable to update template form.',
    deleteErrorMessage: 'Unable to delete template form.',
    deleteFallbackLabel: 'this template form',
  },
  [TemplateType.Email]: {
    singularLabel: 'email template',
    pluralLabel: 'email templates',
    listTitle: 'Email Templates',
    listDescription: 'Manage reusable clinic email templates and preview their content before use.',
    previewTitle: 'Email Preview',
    previewDescription: 'Review the selected email template content exactly as it will be shown.',
    loadingTitle: 'Loading email templates',
    loadingText: 'Fetching email templates from your clinic settings.',
    emptyTitle: 'No email templates',
    emptyText: 'Create your first email template from the add button above.',
    previewEmptyTitle: 'No email template selected',
    previewEmptyText: 'Choose an email template from the left panel to preview it here.',
    addButtonLabel: 'Add Email Template',
    createTitle: 'Create Email Template',
    editTitle: 'Edit Email Template',
    deleteTitle: 'Delete Email Template',
    createSuccessMessage: 'Email template has been created successfully.',
    updateSuccessMessage: 'Email template has been updated successfully.',
    deleteSuccessMessage: 'Email template has been deleted successfully.',
    createErrorMessage: 'Unable to create email template.',
    updateErrorMessage: 'Unable to update email template.',
    deleteErrorMessage: 'Unable to delete email template.',
    deleteFallbackLabel: 'this email template',
  },
  [TemplateType.Sms]: {
    singularLabel: 'sms template',
    pluralLabel: 'sms templates',
    listTitle: 'SMS Templates',
    listDescription: 'Manage reusable clinic SMS templates and preview their content before use.',
    previewTitle: 'SMS Preview',
    previewDescription: 'Review the selected SMS template content exactly as it will be shown.',
    loadingTitle: 'Loading SMS templates',
    loadingText: 'Fetching SMS templates from your clinic settings.',
    emptyTitle: 'No SMS templates',
    emptyText: 'Create your first SMS template from the add button above.',
    previewEmptyTitle: 'No SMS template selected',
    previewEmptyText: 'Choose an SMS template from the left panel to preview it here.',
    addButtonLabel: 'Add SMS Template',
    createTitle: 'Create SMS Template',
    editTitle: 'Edit SMS Template',
    deleteTitle: 'Delete SMS Template',
    createSuccessMessage: 'SMS template has been created successfully.',
    updateSuccessMessage: 'SMS template has been updated successfully.',
    deleteSuccessMessage: 'SMS template has been deleted successfully.',
    createErrorMessage: 'Unable to create SMS template.',
    updateErrorMessage: 'Unable to update SMS template.',
    deleteErrorMessage: 'Unable to delete SMS template.',
    deleteFallbackLabel: 'this SMS template',
  },
};

export const normalizeTemplateType = (type?: TemplateType | string | null): TemplateType =>
  type === TemplateType.Email ||
  `${type ?? ''}`.toLowerCase() === '1' ||
  `${type ?? ''}`.toLowerCase() === 'email' ||
  `${type ?? ''}`.toLowerCase() === 'emailtemplate'
    ? TemplateType.Email
    : type === TemplateType.Sms ||
      `${type ?? ''}`.toLowerCase() === '2' ||
      `${type ?? ''}`.toLowerCase() === 'sms' ||
      `${type ?? ''}`.toLowerCase() === 'smstemplate'
    ? TemplateType.Sms
    : TemplateType.Form;

export const isTemplateOfType = (
  item: TemplateFormModel | null | undefined,
  type: TemplateType
): boolean => normalizeTemplateType(item?.type) === type;

export const getTemplateTypeContent = (type: TemplateType): TemplateTypeContent =>
  TEMPLATE_TYPE_CONTENT[type];

export const getTemplateItemKey = (item?: TemplateFormModel | null): string =>
  item?.id?.trim() || `${item?.templateName?.trim() || ''}::${normalizeTemplateType(item?.type)}`;

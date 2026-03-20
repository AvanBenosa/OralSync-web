import type { Dispatch, SetStateAction } from 'react';

export type TemplateFormModel = {
  id?: string;
  clinicProfileId?: string | null;
  templateName?: string;
  templateContent?: string;
  date?: string | null;
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

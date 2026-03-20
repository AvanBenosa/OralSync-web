import type { Dispatch, SetStateAction } from 'react';
import {
  CreateTemplateForm,
  DeleteTemplateForm,
  GetTemplateForms,
  UpdateTemplateForm,
} from './api';
import { TemplateFormFormValues, TemplateFormModel, TemplateFormStateModel } from './types';

export const HandleGetTemplateForms = async (
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetTemplateForms(clinicId);
  const nextItems = response.items || [];
  const nextSelectedItem =
    nextItems.find((item) => item.id === state.selectedItem?.id) || nextItems[0] || null;

  setState((prev) => ({
    ...prev,
    load: false,
    items: nextItems,
    selectedItem: nextSelectedItem,
    totalItem: response.totalCount || 0,
  }));
};

export const HandleCreateTemplateForm = async (
  request: TemplateFormFormValues,
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>
): Promise<TemplateFormModel> => {
  const response = await CreateTemplateForm(request);
  setState((prev) => ({
    ...prev,
    items: [response, ...prev.items],
    selectedItem: response,
    totalItem: prev.totalItem + 1,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return response;
};

export const HandleUpdateTemplateForm = async (
  request: TemplateFormFormValues,
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>
): Promise<TemplateFormModel> => {
  const response = await UpdateTemplateForm(request);
  setState((prev) => ({
    ...prev,
    items: prev.items.map((item) => (item.id === response.id ? response : item)),
    selectedItem: response,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return response;
};

export const HandleDeleteTemplateForm = async (
  id: string,
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>
): Promise<void> => {
  await DeleteTemplateForm(id);

  const nextItems = state.items.filter((item) => item.id !== id);
  const nextSelectedItem =
    state.selectedItem?.id === id
      ? nextItems[0] || null
      : nextItems.find((item) => item.id === state.selectedItem?.id) || nextItems[0] || null;

  setState((prev) => ({
    ...prev,
    items: nextItems,
    selectedItem: nextSelectedItem,
    totalItem: Math.max(0, prev.totalItem - 1),
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
};

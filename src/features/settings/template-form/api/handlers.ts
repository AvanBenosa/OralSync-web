import type { Dispatch, SetStateAction } from 'react';
import {
  CreateTemplateForm,
  DeleteTemplateForm,
  GetTemplateForms,
  UpdateTemplateForm,
} from './api';
import {
  normalizeTemplateType,
  TemplateFormFormValues,
  TemplateFormModel,
  TemplateFormStateModel,
} from './types';

export const HandleGetTemplateForms = async (
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetTemplateForms(clinicId);
  const nextItems = (response.items || []).map((item) => ({
    ...item,
    type: normalizeTemplateType(item.type),
  }));
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
  const createdItem: TemplateFormModel = {
    ...response,
    type: normalizeTemplateType(response.type ?? request.type),
  };

  setState((prev) => ({
    ...prev,
    items: [createdItem, ...prev.items],
    selectedItem: createdItem,
    totalItem: prev.totalItem + 1,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return createdItem;
};

export const HandleUpdateTemplateForm = async (
  request: TemplateFormFormValues,
  state: TemplateFormStateModel,
  setState: Dispatch<SetStateAction<TemplateFormStateModel>>
): Promise<TemplateFormModel> => {
  const response = await UpdateTemplateForm(request);
  const updatedItem: TemplateFormModel = {
    ...response,
    type: normalizeTemplateType(response.type ?? request.type),
  };

  setState((prev) => ({
    ...prev,
    items: prev.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    selectedItem: updatedItem,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
  return updatedItem;
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

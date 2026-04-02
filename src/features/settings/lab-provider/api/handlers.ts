import type { Dispatch, SetStateAction } from 'react';

import { CreateLabProvider, DeleteLabProvider, GetLabProviders, UpdateLabProvider } from './api';
import { LabProviderFormValues, LabProviderModel, LabProviderStateModel } from './types';

export const HandleGetLabProviders = async (
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetLabProviders(clinicId);
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

export const HandleCreateLabProvider = async (
  request: LabProviderFormValues,
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>
): Promise<LabProviderModel> => {
  const createdItem = await CreateLabProvider(request);

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

export const HandleUpdateLabProvider = async (
  request: LabProviderFormValues,
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>
): Promise<LabProviderModel> => {
  const updatedItem = await UpdateLabProvider(request);

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

export const HandleDeleteLabProvider = async (
  id: string,
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>
): Promise<void> => {
  await DeleteLabProvider(id);

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

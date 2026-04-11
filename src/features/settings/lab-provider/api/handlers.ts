import type { Dispatch, SetStateAction } from 'react';

import { CreateLabProvider, DeleteLabProvider, GetLabProviders, UpdateLabProvider } from './api';
import { LabProviderFormValues, LabProviderModel, LabProviderStateModel } from './types';

const refreshLabProviders = async (
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>,
  preferredSelectedItemId?: string | null
): Promise<void> => {
  const response = await GetLabProviders(state.clinicId);
  const nextItems = response.items || [];
  const nextSelectedItem =
    (preferredSelectedItemId
      ? nextItems.find((item) => item.id === preferredSelectedItemId)
      : null) ||
    nextItems.find((item) => item.id === state.selectedItem?.id) ||
    nextItems[0] ||
    null;

  setState((prev) => ({
    ...prev,
    load: false,
    items: nextItems,
    selectedItem: nextSelectedItem,
    totalItem: response.totalCount || 0,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
};

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

  await refreshLabProviders(state, setState, createdItem.id);

  return createdItem;
};

export const HandleUpdateLabProvider = async (
  request: LabProviderFormValues,
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>
): Promise<LabProviderModel> => {
  const updatedItem = await UpdateLabProvider(request);

  await refreshLabProviders(state, setState, updatedItem.id);

  return updatedItem;
};

export const HandleDeleteLabProvider = async (
  id: string,
  state: LabProviderStateModel,
  setState: Dispatch<SetStateAction<LabProviderStateModel>>
): Promise<void> => {
  await DeleteLabProvider(id);

  await refreshLabProviders(
    state,
    setState,
    state.selectedItem?.id && state.selectedItem.id !== id ? state.selectedItem.id : null
  );
};

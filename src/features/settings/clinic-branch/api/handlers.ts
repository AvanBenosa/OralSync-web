import type { Dispatch, SetStateAction } from 'react';

import {
  CreateClinicBranch,
  DeleteClinicBranch,
  GetClinicBranches,
  UpdateClinicBranch,
} from './api';
import {
  ClinicBranchFormValues,
  ClinicBranchModel,
  ClinicBranchStateModel,
} from './types';

export const HandleGetClinicBranches = async (
  state: ClinicBranchStateModel,
  setState: Dispatch<SetStateAction<ClinicBranchStateModel>>,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetClinicBranches(clinicId);
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

export const HandleCreateClinicBranch = async (
  request: ClinicBranchFormValues,
  setState: Dispatch<SetStateAction<ClinicBranchStateModel>>
): Promise<ClinicBranchModel> => {
  const createdItem = await CreateClinicBranch(request);

  setState((prev) => ({
    ...prev,
    items: [createdItem, ...prev.items].sort((leftItem, rightItem) => {
      if (leftItem.isMainBranch && !rightItem.isMainBranch) return -1;
      if (!leftItem.isMainBranch && rightItem.isMainBranch) return 1;
      return (leftItem.name || '').localeCompare(rightItem.name || '');
    }),
    selectedItem: createdItem,
    totalItem: prev.totalItem + 1,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));

  return createdItem;
};

export const HandleUpdateClinicBranch = async (
  request: ClinicBranchFormValues,
  setState: Dispatch<SetStateAction<ClinicBranchStateModel>>
): Promise<ClinicBranchModel> => {
  const updatedItem = await UpdateClinicBranch(request);

  setState((prev) => ({
    ...prev,
    items: prev.items
      .map((item) => (item.id === updatedItem.id ? updatedItem : item))
      .sort((leftItem, rightItem) => {
        if (leftItem.isMainBranch && !rightItem.isMainBranch) return -1;
        if (!leftItem.isMainBranch && rightItem.isMainBranch) return 1;
        return (leftItem.name || '').localeCompare(rightItem.name || '');
      }),
    selectedItem: updatedItem,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));

  return updatedItem;
};

export const HandleDeleteClinicBranch = async (
  id: string,
  state: ClinicBranchStateModel,
  setState: Dispatch<SetStateAction<ClinicBranchStateModel>>
): Promise<void> => {
  await DeleteClinicBranch(id);

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

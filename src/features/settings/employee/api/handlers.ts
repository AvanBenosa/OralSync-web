import type { Dispatch, SetStateAction } from 'react';

import { CreateEmployee, DeleteEmployee, GetEmployees, UpdateEmployee } from './api';
import { EmployeeFormValues, EmployeeModel, EmployeeStateModel } from './types';

const refreshEmployees = async (
  state: EmployeeStateModel,
  setState: Dispatch<SetStateAction<EmployeeStateModel>>,
  preferredSelectedItemId?: string | null
): Promise<void> => {
  const response = await GetEmployees(state.clinicId);
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

export const HandleGetEmployees = async (
  state: EmployeeStateModel,
  setState: Dispatch<SetStateAction<EmployeeStateModel>>,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetEmployees(clinicId);
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

export const HandleCreateEmployee = async (
  request: EmployeeFormValues,
  state: EmployeeStateModel,
  setState: Dispatch<SetStateAction<EmployeeStateModel>>
): Promise<EmployeeModel> => {
  const createdItem = await CreateEmployee(request);

  await refreshEmployees(state, setState, createdItem.id);

  return createdItem;
};

export const HandleUpdateEmployee = async (
  request: EmployeeFormValues,
  state: EmployeeStateModel,
  setState: Dispatch<SetStateAction<EmployeeStateModel>>
): Promise<EmployeeModel> => {
  const updatedItem = await UpdateEmployee(request);

  await refreshEmployees(state, setState, updatedItem.id);

  return updatedItem;
};

export const HandleDeleteEmployee = async (
  id: string,
  state: EmployeeStateModel,
  setState: Dispatch<SetStateAction<EmployeeStateModel>>
): Promise<void> => {
  await DeleteEmployee(id);

  await refreshEmployees(
    state,
    setState,
    state.selectedItem?.id && state.selectedItem.id !== id ? state.selectedItem.id : null
  );
};

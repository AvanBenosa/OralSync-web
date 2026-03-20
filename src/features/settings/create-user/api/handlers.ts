import { CreateClinicUser, DeleteClinicUser, GetClinicUsers, UpdateClinicUser } from './api';
import {
  CreateUserFormValues,
  CreateUserStateModel,
  SettingsUserModel,
} from './types';

export const HandleGetClinicUsers = async (
  state: CreateUserStateModel,
  setState: Function,
  clinicId?: string | null
): Promise<void> => {
  const response = await GetClinicUsers(clinicId);
  setState({
    ...state,
    load: false,
    items: response.items || [],
    item: state.item,
    totalItem: response.totalCount || 0,
  });
};

export const HandleCreateClinicUser = async (
  request: CreateUserFormValues,
  state: CreateUserStateModel,
  setState: Function
): Promise<SettingsUserModel> => {
  const response = await CreateClinicUser(request);
  setState({
    ...state,
    items: [response, ...state.items],
    item: null,
    isUpdate: false,
    isDelete: false,
    totalItem: state.totalItem + 1,
  });
  return response;
};

export const HandleUpdateClinicUser = async (
  request: CreateUserFormValues,
  state: CreateUserStateModel,
  setState: Function
): Promise<SettingsUserModel> => {
  const response = await UpdateClinicUser(request);
  setState({
    ...state,
    item: response,
    isUpdate: false,
    isDelete: false,
    items: state.items.map((item) => (item.id === response.id ? response : item)),
  });
  return response;
};

export const HandleDeleteClinicUser = async (
  id: string,
  state: CreateUserStateModel,
  setState: Function
): Promise<void> => {
  await DeleteClinicUser(id);
  setState({
    ...state,
    item: state.item?.id === id ? null : state.item,
    isUpdate: state.item?.id === id ? false : state.isUpdate,
    isDelete: false,
    items: state.items.filter((item) => item.id !== id),
    totalItem: Math.max(0, state.totalItem - 1),
  });
};

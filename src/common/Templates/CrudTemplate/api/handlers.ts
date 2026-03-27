// TODO: Replace MODULE_NAME, module_name tokens (see types.ts header)

import { CreateMODULE_NAME, DeleteMODULE_NAME, GetMODULE_NAMEs, UpdateMODULE_NAME } from './api';
import { MODULE_NAMEModel, MODULE_NAMEStateModel } from './types';

export const HandleGetMODULE_NAMEs = async (
  state: MODULE_NAMEStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetMODULE_NAMEs(state, clinicId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response.items || [],
    pageStart:
      response.pageStart && response.totalCount && response.pageStart === response.totalCount
        ? response.pageStart - response.pageEnd
        : response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
  });
};

export const HandleCreateMODULE_NAME = async (
  request: MODULE_NAMEModel,
  state: MODULE_NAMEStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateMODULE_NAME(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
    totalItem: state.totalItem + 1,
  });
};

export const HandleUpdateMODULE_NAME = async (
  request: MODULE_NAMEModel,
  state: MODULE_NAMEStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateMODULE_NAME(request);
  setState({
    ...state,
    items: state.items.map((item) => (item.id === response.id ? response : item)),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeleteMODULE_NAME = async (
  request: MODULE_NAMEModel,
  state: MODULE_NAMEStateModel,
  setState: Function
): Promise<void> => {
  await DeleteMODULE_NAME(request);

  setState((prev: MODULE_NAMEStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;
    const nextItems = prev.items.filter(
      (item) => selectedId === undefined || item.id !== selectedId
    );
    return {
      ...prev,
      items: nextItems,
      openModal: false,
      totalItem: Math.max(prev.totalItem - 1, 0),
    };
  });
};

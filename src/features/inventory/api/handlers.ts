import { CreateInventory, DeleteInventory, GetInventories, UpdateInventory } from './api';
import { InventoryModel, InventoryStateModel } from './types';

export const HandleGetInventories = async (
  state: InventoryStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetInventories(state, clinicId, forceRefresh);
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

export const HandleCreateInventory = async (
  request: InventoryModel,
  state: InventoryStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateInventory(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
    totalItem: state.totalItem + 1,
  });
};

export const HandleUpdateInventory = async (
  request: InventoryModel,
  state: InventoryStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateInventory(request);
  setState({
    ...state,
    items: state.items.map((item) => (item.id === response.id ? response : item)),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeleteInventory = async (
  request: InventoryModel,
  state: InventoryStateModel,
  setState: Function
): Promise<void> => {
  await DeleteInventory(request);

  setState((prev: InventoryStateModel) => {
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

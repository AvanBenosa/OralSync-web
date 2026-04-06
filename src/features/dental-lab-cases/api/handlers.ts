import {
  CreateDentalLabCase,
  DeleteDentalLabCase,
  GetDentalLabCases,
  UpdateDentalLabCase,
} from './api';
import { DentalLabCaseModel, DentalLabCaseStateModel } from './types';

const getPagingStateFromResponse = (response: {
  items?: DentalLabCaseModel[];
  pageStart?: number;
  pageEnd?: number;
  totalCount?: number;
}) => {
  const pageStart = response.pageStart ?? 0;
  const pageEnd = response.pageEnd ?? 25;
  const totalCount = response.totalCount ?? 0;

  return {
    items: response.items || [],
    pageStart: pageStart && totalCount && pageStart === totalCount ? pageStart - pageEnd : pageStart,
    pageEnd,
    totalItem: totalCount,
  };
};

export const HandleGetDentalLabCases = async (
  state: DentalLabCaseStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetDentalLabCases(state, clinicId, forceRefresh);
  setState((prev: DentalLabCaseStateModel) => ({
    ...prev,
    load: false,
    ...getPagingStateFromResponse(response),
  }));
};

export const HandleCreateDentalLabCase = async (
  request: DentalLabCaseModel,
  state: DentalLabCaseStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateDentalLabCase(request);
  setState((prev: DentalLabCaseStateModel) => ({
    ...prev,
    openModal: false,
    selectedItem: undefined,
    isUpdate: false,
    isDelete: false,
    items: [response, ...prev.items],
    totalItem: prev.totalItem + 1,
  }));
};

export const HandleUpdateDentalLabCase = async (
  request: DentalLabCaseModel,
  state: DentalLabCaseStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateDentalLabCase(request);
  const lookupId = response.id || request.id || state.selectedItem?.id;

  setState((prev: DentalLabCaseStateModel) => {
    const nextItems = lookupId
      ? prev.items.map((item) =>
          item.id === lookupId
            ? {
                ...item,
                ...response,
                id: lookupId,
              }
            : item
        )
      : prev.items;

    return {
      ...prev,
      items: nextItems,
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });

  try {
    const refreshedResponse = await GetDentalLabCases(
      {
        ...state,
        openModal: false,
        selectedItem: undefined,
        isUpdate: false,
        isDelete: false,
      },
      state.clinicProfileId,
      true
    );

    setState((prev: DentalLabCaseStateModel) => ({
      ...prev,
      ...getPagingStateFromResponse(refreshedResponse),
    }));
  } catch {
    // Keep the optimistic local replacement if the follow-up refresh fails.
  }
};

export const HandleDeleteDentalLabCase = async (
  request: DentalLabCaseModel,
  state: DentalLabCaseStateModel,
  setState: Function
): Promise<void> => {
  await DeleteDentalLabCase(request);

  setState((prev: DentalLabCaseStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;
    const nextItems = prev.items.filter((item) => selectedId === undefined || item.id !== selectedId);

    return {
      ...prev,
      items: nextItems,
      openModal: false,
      totalItem: Math.max(prev.totalItem - 1, 0),
    };
  });
};

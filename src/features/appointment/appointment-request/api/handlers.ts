import {
  contributesToAppointmentSummary,
  CreateAppointment,
  DeleteAppointment,
  GetAppointments,
  InvalidateAppointmentResponseCache,
  matchesAppointmentFilters,
  UpdateAppointment,
} from './api';
import { AppointmentModel, AppointmentStateModel } from './types';

export const HandleGetAppointments = async (
  state: AppointmentStateModel,
  setState: Function,
  forceRefresh: boolean = false,
  updatePageMeta: boolean = true
): Promise<void> => {
  const response = await GetAppointments(state, forceRefresh);
  setState((prev: AppointmentStateModel) => ({
    ...prev,
    ...state,
    load: false,
    items: response.items || [],
    pageStart: updatePageMeta ? response.pageStart : prev.pageStart,
    pageEnd: updatePageMeta ? response.pageEnd : prev.pageEnd,
    totalItem: response.totalCount,
    summaryCount: response.summaryCount,
    hasDateFilter: response.hasDateFilter,
  }));
};

export const HandleCreateAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateAppointment(request);
  InvalidateAppointmentResponseCache();

  setState((prev: AppointmentStateModel) => {
    const matchesFilters = matchesAppointmentFilters(response, prev);
    const contributesToSummary = contributesToAppointmentSummary(response, prev);

    return {
      ...prev,
      openModal: false,
      selectedItem: undefined,
      items: matchesFilters ? [response, ...prev.items] : prev.items,
      totalItem: prev.totalItem + (matchesFilters ? 1 : 0),
      summaryCount: prev.summaryCount + (contributesToSummary ? 1 : 0),
    };
  });
};

export const HandleUpdateAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateAppointment(request);
  InvalidateAppointmentResponseCache();

  setState((prev: AppointmentStateModel) => {
    const previousItem = prev.selectedItem;
    const matchedBefore = previousItem ? matchesAppointmentFilters(previousItem, prev) : false;
    const matchedAfter = matchesAppointmentFilters(response, prev);
    const contributedBefore = previousItem
      ? contributesToAppointmentSummary(previousItem, prev)
      : false;
    const contributedAfter = contributesToAppointmentSummary(response, prev);

    let nextItems = prev.items;

    if (matchedBefore && matchedAfter) {
      nextItems = prev.items.map((item) =>
        item.id === response.id || item.id === previousItem?.id ? response : item
      );
    } else if (matchedBefore && !matchedAfter) {
      nextItems = prev.items.filter(
        (item) => item.id !== response.id && item.id !== previousItem?.id
      );
    } else if (!matchedBefore && matchedAfter) {
      nextItems = [response, ...prev.items];
    }

    return {
      ...prev,
      items: nextItems,
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
      totalItem: Math.max(prev.totalItem - (matchedBefore ? 1 : 0) + (matchedAfter ? 1 : 0), 0),
      summaryCount: Math.max(
        prev.summaryCount - (contributedBefore ? 1 : 0) + (contributedAfter ? 1 : 0),
        0
      ),
    };
  });
};

export const HandleDeleteAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  await DeleteAppointment(request);
  InvalidateAppointmentResponseCache();

  setState((prev: AppointmentStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;
    const selectedItem = prev.selectedItem ?? request;
    const matchedFilters = matchesAppointmentFilters(selectedItem, prev);
    const contributedToSummary = contributesToAppointmentSummary(selectedItem, prev);

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      openModal: false,
      totalItem: Math.max(prev.totalItem - (matchedFilters ? 1 : 0), 0),
      summaryCount: Math.max(prev.summaryCount - (contributedToSummary ? 1 : 0), 0),
    };
  });
};

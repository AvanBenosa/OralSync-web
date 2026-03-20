import { CreateAppointment, DeleteAppointment, GetAppointments, UpdateAppointment } from './api';
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
  }));
};

export const HandleCreateAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreateAppointment(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
    totalItem: state.totalItem + 1,
  });
};

export const HandleUpdateAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdateAppointment(request);
  setState({
    ...state,
    items: state.items.map((item) =>
      item.id === response.id || item.id === state.selectedItem?.id ? response : item
    ),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeleteAppointment = async (
  request: AppointmentModel,
  state: AppointmentStateModel,
  setState: Function
): Promise<void> => {
  await DeleteAppointment(request);

  setState((prev: AppointmentStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      openModal: false,
      totalItem: Math.max(prev.totalItem - 1, 0),
    };
  });
};

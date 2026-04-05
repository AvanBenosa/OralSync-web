import {
  CreatePatientPerioChartItem,
  DeletePatientPerioChartItem,
  GetPatientPerioChartItems,
  UpdatePatientPerioChartItem,
} from './api';
import { PatientPerioChartModel, PatientPerioChartStateModel } from './types';

export const HandleGetPatientPerioChartItems = async (
  state: PatientPerioChartStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientPerioChartItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientPerioChartItem = async (
  request: PatientPerioChartModel,
  state: PatientPerioChartStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientPerioChartItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    selectedToothId: undefined,
    items: [...state.items, response].sort(
      (left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)
    ),
  });
};

export const HandleUpdatePatientPerioChartItem = async (
  request: PatientPerioChartModel,
  state: PatientPerioChartStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientPerioChartItem(request);
  setState({
    ...state,
    items: state.items
      .map((item) =>
        item.id === response.id || item.id === state.selectedItem?.id ? response : item
      )
      .sort((left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)),
    selectedItem: undefined,
    selectedToothId: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeletePatientPerioChartItem = async (
  request: PatientPerioChartModel,
  state: PatientPerioChartStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientPerioChartItem(request);

  setState((prev: PatientPerioChartStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      selectedItem: undefined,
      selectedToothId: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

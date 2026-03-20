import {
  CreatePatientDentalChartItem,
  DeletePatientDentalChartItem,
  GetPatientDentalChartItems,
  UpdatePatientDentalChartItem,
} from './api';
import { PatientDentalChartModel, PatientDentalChartStateModel } from './types';

export const HandleGetPatientDentalChartItems = async (
  state: PatientDentalChartStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientDentalChartItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientDentalChartItem = async (
  request: PatientDentalChartModel,
  state: PatientDentalChartStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientDentalChartItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [...state.items, response].sort(
      (left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)
    ),
  });
};

export const HandleUpdatePatientDentalChartItem = async (
  request: PatientDentalChartModel,
  state: PatientDentalChartStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientDentalChartItem(request);
  setState({
    ...state,
    items: state.items
      .map((item) => (item.id === response.id || item.id === state.selectedItem?.id ? response : item))
      .sort((left, right) => (left.toothNumber ?? 0) - (right.toothNumber ?? 0)),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeletePatientDentalChartItem = async (
  request: PatientDentalChartModel,
  state: PatientDentalChartStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientDentalChartItem(request);

  setState((prev: PatientDentalChartStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    return {
      ...prev,
      items: prev.items.filter((item) => selectedId === undefined || item.id !== selectedId),
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

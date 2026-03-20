import {
  CreatePatientOverViewItem,
  DeletePatientOverViewItem,
  GetPatientOverViewItems,
  UpdatePatientOverViewItem,
} from './api';
import { PatientOverViewModel, PatientOverViewStateModel } from './types';

export const HandleGetPatientOverViewItems = async (
  state: PatientOverViewStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientOverViewItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientOverViewItem = async (
  request: PatientOverViewModel,
  state: PatientOverViewStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientOverViewItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
  });
};

export const HandleUpdatePatientOverViewItem = async (
  request: PatientOverViewModel,
  state: PatientOverViewStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientOverViewItem(request);
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

export const HandleDeletePatientOverViewItem = async (
  request: PatientOverViewModel,
  state: PatientOverViewStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientOverViewItem(request);

  setState((prev: PatientOverViewStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;

    const nextItems = prev.items.filter(
      (item) => selectedId === undefined || item.id !== selectedId
    );

    return {
      ...prev,
      items: nextItems,
      selectedItem: undefined,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

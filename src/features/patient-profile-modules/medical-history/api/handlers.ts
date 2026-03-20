import {
  CreatePatientMedicalHistoryItem,
  DeletePatientMedicalHistoryItem,
  GetPatientMedicalHistoryItems,
  UpdatePatientMedicalHistoryItem,
} from './api';
import { PatientMedicalHistoryModel, PatientMedicalHistoryStateModel } from './types';

export const HandleGetPatientMedicalHistoryItems = async (
  state: PatientMedicalHistoryStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientMedicalHistoryItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel,
  state: PatientMedicalHistoryStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientMedicalHistoryItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
  });
};

export const HandleUpdatePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel,
  state: PatientMedicalHistoryStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientMedicalHistoryItem(request);
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

export const HandleDeletePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel,
  state: PatientMedicalHistoryStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientMedicalHistoryItem(request.patientInfoId ?? state.patientId, request.id);

  setState((prev: PatientMedicalHistoryStateModel) => {
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

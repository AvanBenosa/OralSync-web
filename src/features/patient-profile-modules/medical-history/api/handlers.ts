import {
  CreatePatientMedicalHistoryItem,
  DeletePatientMedicalHistoryItem,
  GetPatientMedicalHistoryItems,
  InvalidatePatientMedicalHistoryCache,
  UpdatePatientMedicalHistoryItem,
} from './api';
import { PatientMedicalHistoryModel, PatientMedicalHistoryStateModel } from './types';

const mergeMedicalHistoryItem = (
  request: PatientMedicalHistoryModel,
  response?: PatientMedicalHistoryModel
): PatientMedicalHistoryModel => {
  const mergedItem: PatientMedicalHistoryModel = { ...request };

  Object.entries(response || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      (mergedItem as Record<string, unknown>)[key] = value;
    }
  });

  mergedItem.q11Conditions = response?.q11Conditions ?? request.q11Conditions ?? [];

  return mergedItem;
};

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
  const resolvedResponse = mergeMedicalHistoryItem(request, response);
  InvalidatePatientMedicalHistoryCache(request.patientInfoId ?? state.patientId);

  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [resolvedResponse, ...state.items],
  });
};

export const HandleUpdatePatientMedicalHistoryItem = async (
  request: PatientMedicalHistoryModel,
  state: PatientMedicalHistoryStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientMedicalHistoryItem(request);
  const resolvedResponse = mergeMedicalHistoryItem(request, response);
  InvalidatePatientMedicalHistoryCache(request.patientInfoId ?? state.patientId);

  setState({
    ...state,
    items: state.items.map((item) =>
      item.id === resolvedResponse.id || item.id === state.selectedItem?.id
        ? resolvedResponse
        : item
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
  InvalidatePatientMedicalHistoryCache(request.patientInfoId ?? state.patientId);

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

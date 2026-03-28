import {
  CreatePatientAppointmentRecordItem,
  DeletePatientAppointmentRecordItem,
  GetPatientAppointmentRecordItems,
  InvalidatePatientAppointmentRecordCache,
  UpdatePatientAppointmentRecordItem,
} from './api';
import {
  PatientAppointmentRecordModel,
  PatientAppointmentRecordStateModel,
} from './types';

export const HandleGetPatientAppointmentRecordItems = async (
  state: PatientAppointmentRecordStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientAppointmentRecordItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientAppointmentRecordItem = async (
  request: PatientAppointmentRecordModel,
  state: PatientAppointmentRecordStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientAppointmentRecordItem(request);
  InvalidatePatientAppointmentRecordCache();
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
  });
};

export const HandleUpdatePatientAppointmentRecordItem = async (
  request: PatientAppointmentRecordModel,
  state: PatientAppointmentRecordStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientAppointmentRecordItem(request);
  InvalidatePatientAppointmentRecordCache();
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

export const HandleDeletePatientAppointmentRecordItem = async (
  request: PatientAppointmentRecordModel,
  state: PatientAppointmentRecordStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientAppointmentRecordItem(request.patientInfoId ?? state.patientId, request.id);
  InvalidatePatientAppointmentRecordCache();

  setState((prev: PatientAppointmentRecordStateModel) => {
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

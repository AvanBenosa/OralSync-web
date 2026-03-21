import {
  CreatePatientProgressNoteItem,
  DeletePatientProgressNoteItem,
  GetPatientProgressNoteItems,
  UpdatePatientProgressNoteItem,
} from './api';
import { PatientProgressNoteModel, PatientProgressNoteStateModel } from './types';

export const HandleGetPatientProgressNoteItems = async (
  state: PatientProgressNoteStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientProgressNoteItems({ patientId }, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientProgressNoteItem = async (
  request: PatientProgressNoteModel,
  state: PatientProgressNoteStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientProgressNoteItem(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
  });
};

export const HandleUpdatePatientProgressNoteItem = async (
  request: PatientProgressNoteModel,
  state: PatientProgressNoteStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientProgressNoteItem(request);
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

export const HandleDeletePatientProgressNoteItem = async (
  request: PatientProgressNoteModel,
  state: PatientProgressNoteStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientProgressNoteItem(request.patientInfoId ?? state.patientId, request.id);

  setState((prev: PatientProgressNoteStateModel) => {
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

import { CreatePatient, DeletePatient, GetPatients, UpdatePatient, UploadPatientXlsx } from './api';
import { PatientModel, PatientStateModel, PatientUploadResultModel } from './types';

export const HandleGetPatients = async (
  state: PatientStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatients(state, clinicId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response.items || [],
    pageStart:
      response.pageStart && response.totalCount && response.pageStart === response.totalCount
        ? response.pageStart - response.pageEnd
        : response.pageStart,
    pageEnd: response.pageEnd,
    totalItem: response.totalCount,
  });
};

export const HandleCreatePatient = async (
  request: PatientModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatient(request);
  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [response, ...state.items],
    totalItem: state.totalItem + 1,
  });
};

export const HandleUpdatePatient = async (
  request: PatientModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatient(request);
  setState({
    ...state,
    items: state.items.map((item) =>
      item.id === response.id ||
      item.id === state.selectedItem?.id ||
      item.patientNumber === state.selectedItem?.patientNumber
        ? response
        : item
    ),
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
};

export const HandleDeletePatient = async (
  request: PatientModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatient(request);

  setState((prev: PatientStateModel) => {
    const selectedId = prev.selectedItem?.id ?? request.id;
    const selectedPatientNumber = prev.selectedItem?.patientNumber ?? request.patientNumber;

    const nextItems = prev.items.filter(
      (item) =>
        (selectedId === undefined || item.id !== selectedId) &&
        (selectedPatientNumber === undefined || item.patientNumber !== selectedPatientNumber)
    );

    return {
      ...prev,
      items: nextItems,
      openModal: false,
      totalItem: Math.max(prev.totalItem - 1, 0),
    };
  });
};

export const HandleUploadPatientXlsx = async (
  file: File,
  state: PatientStateModel,
  setState: Function,
  clinicId?: string | null
): Promise<PatientUploadResultModel> => {
  const response = await UploadPatientXlsx(file);

  await HandleGetPatients(
    {
      ...state,
      load: true,
      openModal: true,
      isUpdate: false,
      isDelete: false,
      upload: true,
      selectedItem: undefined,
    },
    setState,
    clinicId,
    true
  );

  return response;
};

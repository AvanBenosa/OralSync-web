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
  await CreatePatient(request);

  const requestState: PatientStateModel = {
    ...state,
    load: true,
    openModal: false,
    selectedItem: undefined,
    isUpdate: false,
    isDelete: false,
  };

  setState(requestState);
  await HandleGetPatients(requestState, setState, state.clinicProfileId, true);
};

export const HandleUpdatePatient = async (
  request: PatientModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  await UpdatePatient(request);

  const requestState: PatientStateModel = {
    ...state,
    load: true,
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  };

  setState(requestState);
  await HandleGetPatients(requestState, setState, state.clinicProfileId, true);
};

export const HandleDeletePatient = async (
  request: PatientModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatient(request);

  const requestState: PatientStateModel = {
    ...state,
    load: true,
    openModal: false,
    isDelete: false,
    isUpdate: false,
    selectedItem: undefined,
  };

  setState(requestState);
  await HandleGetPatients(requestState, setState, state.clinicProfileId, true);
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

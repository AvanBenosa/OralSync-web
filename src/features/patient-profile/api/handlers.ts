import { DeletePatientProfile, GetPatientProfile, SendPatientEmail, UpdatePatientProfile } from './api';
import {
  PatientEmailRequestModel,
  PatientEmailResponseModel,
  PatientProfileModel,
  PatientStateModel,
} from './types';

export const HandleGetPatientProfile = async (
  setState: Function,
  patientId?: string,
  clinicId?: string,
  forceRefresh: boolean = false
) : Promise<PatientProfileModel | null> => {
  const response = await GetPatientProfile(patientId, clinicId, forceRefresh);

  setState((prev: PatientStateModel) => ({
    ...prev,
    load: false,
    patientId,
    profile: response ?? null,
  }));

  return response ?? null;
};

export const HandleDeletePatientProfile = async (
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  const patientId = state.patientId ?? state.profile?.id;

  if (!patientId) {
    throw new Error('Patient ID is required for delete.');
  }

  await DeletePatientProfile(patientId);

  setState((prev: PatientStateModel) => {
    return {
      ...prev,
      openModal: false,
      isUpdate: false,
      isDelete: false,
    };
  });
};

export const HandleUpdatePatientProfile = async (
  request: PatientProfileModel,
  state: PatientStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientProfile(request);

  setState((prev: PatientStateModel) => ({
    ...prev,
    profile: response,
    patientId: response.id ?? prev.patientId,
    selectedItem: undefined,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  }));
};

export const HandleSendPatientEmail = async (
  request: PatientEmailRequestModel,
  state: PatientStateModel,
  setState: Function
): Promise<PatientEmailResponseModel> => {
  const response = await SendPatientEmail(request);

  setState((prev: PatientStateModel) => ({
    ...prev,
    openModal: false,
    isEmail: false,
    isDelete: false,
    isUpdate: false,
  }));

  void state;
  return response;
};

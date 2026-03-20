import {
  CreatePatientFormItem,
  DeletePatientFormItem,
  GetPatientFormItems,
  UpdatePatientFormItem,
} from './api';
import { PatientFormModel, PatientFormStateModel } from './types';

export const HandleGetPatientFormItems = async (
  state: PatientFormStateModel,
  setState: Function,
  patientId?: string,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetPatientFormItems(patientId, forceRefresh);
  setState({
    ...state,
    load: false,
    items: response || [],
  });
};

export const HandleCreatePatientFormItem = async (
  request: PatientFormModel,
  state: PatientFormStateModel,
  setState: Function
): Promise<void> => {
  const response = await CreatePatientFormItem(request);
  const resolvedResponse: PatientFormModel = { ...request, ...response };

  setState({
    ...state,
    openModal: false,
    selectedItem: undefined,
    items: [resolvedResponse, ...state.items],
  });
};

export const HandleUpdatePatientFormItem = async (
  request: PatientFormModel,
  state: PatientFormStateModel,
  setState: Function
): Promise<void> => {
  const response = await UpdatePatientFormItem(request);
  const resolvedResponse: PatientFormModel = { ...request, ...response };

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
    isView: false,
  });
};

export const HandleDeletePatientFormItem = async (
  request: PatientFormModel,
  state: PatientFormStateModel,
  setState: Function
): Promise<void> => {
  await DeletePatientFormItem(request.patientInfoId ?? state.patientId, request.id);

  setState((prev: PatientFormStateModel) => {
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
      isView: false,
    };
  });
};

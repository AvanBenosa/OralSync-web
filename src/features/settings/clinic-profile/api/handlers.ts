import { GetCurrentClinicProfile, UpdateClinicProfile } from './api';
import { ClinicProfileModel, ClinicProfileStateModel } from './types';

const getDefaultSchedule = (): Pick<
  ClinicProfileModel,
  'openingTime' | 'closingTime' | 'lunchStartTime' | 'lunchEndTime' | 'workingDays'
> => ({
  openingTime: '09:00',
  closingTime: '18:00',
  lunchStartTime: '12:00',
  lunchEndTime: '13:00',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
});

const mergeClinicSchedule = (response: ClinicProfileModel): ClinicProfileModel => {
  const defaults = getDefaultSchedule();

  return {
    ...defaults,
    ...response,
    workingDays: response.workingDays?.length ? response.workingDays : defaults.workingDays,
  };
};

export const HandleGetCurrentClinicProfile = async (
  state: ClinicProfileStateModel,
  setState: Function,
  clinicId?: string | null,
  forceRefresh: boolean = false
): Promise<void> => {
  const response = await GetCurrentClinicProfile(clinicId, forceRefresh);
  const mergedResponse = mergeClinicSchedule(response);
  setState({
    ...state,
    load: false,
    item: mergedResponse,
    clinicProfileId: mergedResponse.id ?? clinicId ?? state.clinicProfileId ?? null,
  });
};

export const HandleUpdateClinicProfile = async (
  request: ClinicProfileModel,
  state: ClinicProfileStateModel,
  setState: Function
): Promise<ClinicProfileModel> => {
  const response = await UpdateClinicProfile(request);
  const mergedResponse = mergeClinicSchedule(response);
  setState({
    ...state,
    item: mergedResponse,
    load: false,
    openModal: false,
    isUpdate: false,
    isDelete: false,
  });
  return mergedResponse;
};

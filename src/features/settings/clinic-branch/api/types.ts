import type { Dispatch, SetStateAction } from 'react';

export type ClinicBranchModel = {
  id?: string;
  clinicProfileId?: string | null;
  name?: string;
  code?: string;
  bannerImagePath?: string;
  address?: string;
  emailAddress?: string;
  contactNumber?: string;
  openingTime?: string;
  closingTime?: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  isMondayOpen?: boolean;
  isTuesdayOpen?: boolean;
  isWednesdayOpen?: boolean;
  isThursdayOpen?: boolean;
  isFridayOpen?: boolean;
  isSaturdayOpen?: boolean;
  isSundayOpen?: boolean;
  isMainBranch?: boolean;
  isActive?: boolean;
};

export type ClinicBranchResponseModel = {
  items: ClinicBranchModel[];
  totalCount: number;
};

export type ClinicBranchFormValues = {
  id?: string;
  name: string;
  code: string;
  bannerImagePath: string;
  address: string;
  emailAddress: string;
  contactNumber: string;
  openingTime: string;
  closingTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  isMondayOpen: boolean;
  isTuesdayOpen: boolean;
  isWednesdayOpen: boolean;
  isThursdayOpen: boolean;
  isFridayOpen: boolean;
  isSaturdayOpen: boolean;
  isSundayOpen: boolean;
  isMainBranch: boolean;
  isActive: boolean;
};

export type ClinicBranchStateModel = {
  items: ClinicBranchModel[];
  selectedItem: ClinicBranchModel | null;
  load: boolean;
  totalItem: number;
  clinicId?: string | null;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
};

export type ClinicBranchStateProps = {
  state: ClinicBranchStateModel;
  setState: Dispatch<SetStateAction<ClinicBranchStateModel>>;
};

export type ClinicBranchBannerUploadResponse = {
  fileName: string;
  filePath: string;
};

export const getClinicBranchItemKey = (item?: ClinicBranchModel | null): string =>
  item?.id?.trim() || `${item?.name?.trim() || ''}::${item?.code?.trim() || ''}`;

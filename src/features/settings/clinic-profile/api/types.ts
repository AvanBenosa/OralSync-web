export type ClinicProfileModel = {
  id?: string;
  clinicName?: string;
  bannerImagePath?: string;
  qrCodeValue?: string;
  address?: string;
  emailAddress?: string;
  contactNumber?: string;
  isDataPrivacyAccepted?: boolean;
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
  workingDays?: string[];
};

export type ClinicProfileStateModel = {
  item: ClinicProfileModel | null;
  load: boolean;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  clinicProfileId?: string | null;
};

export type ClinicProfileStateProps = {
  state: ClinicProfileStateModel;
  setState: Function;
  onReload?: () => void;
};

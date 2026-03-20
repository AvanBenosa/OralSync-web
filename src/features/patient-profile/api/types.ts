export type PatientProfileProps = {
  clinicId?: string;
  patientId?: string;
};

export type PatientProfileModel = {
  id?: string;
  patientNumber?: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  emailAddress?: string;
  birthDate?: Date;
  contactNumber?: string;
  address?: string;
  occupation?: string;
  religion?: string;
  age?: number;
  remarks?: string;
};

export type PatientEmailRequestModel = {
  patientId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
};

export type PatientEmailResponseModel = {
  queued: boolean;
  recipientEmail: string;
  subject: string;
  queuedAt: string;
};

export type PatientSmsRequestModel = {
  patientId?: string;
  recipientNumber: string;
  message: string;
  senderName?: string;
  usePriority?: boolean;
};

export type PatientSmsResponseModel = {
  queued: boolean;
  recipientNumber: string;
  message: string;
  queuedAt: string;
};

export type PatientProfileMobileReloadConfig = {
  onReload?: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
};

export type PatientStateModel = {
  profile: PatientProfileModel | null;
  load: boolean;
  notFound: boolean;
  patientId?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  isEmail: boolean;
  selectedItem?: PatientProfileModel;
  tabItemType?: string;
};

export type PatientProfileStateProps = {
  state: PatientStateModel;
  setState: Function;
  onBack?: () => void;
  patientId?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  mobileReload?: PatientProfileMobileReloadConfig;
};

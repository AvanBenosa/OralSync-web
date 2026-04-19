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
  birthDate?: string | Date;
  contactNumber?: string;
  address?: string;
  gender?: string;
  occupation?: string;
  religion?: string;
  civilStatus?: string;
  age?: number;
  remarks?: string;
  createdAt?: string | Date;
};

export type PatientEmailRequestModel = {
  patientId?: string;
  templateFormId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  isBodyHtml?: boolean;
  attachments?: PatientEmailAttachmentRequestModel[];
};

export type PatientEmailAttachmentRequestModel = {
  fileName: string;
  contentType: string;
  base64Content: string;
};

export type PatientEmailResponseModel = {
  queued: boolean;
  recipientEmail: string;
  subject: string;
  queuedAt: string;
  attachmentCount?: number;
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

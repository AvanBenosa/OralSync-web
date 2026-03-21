export type AppointmentProps = {
  clinicId?: string;
};

export type AppointmentViewTab = 'requests' | 'calendar';

export type AppointmentModel = {
  id?: string;
  patientInfoId?: string;
  appointmentDateFrom?: string | Date;
  appointmentDateTo?: string | Date;
  reasonForVisit?: string;
  status?: string;
  remarks?: string;
  patientName?: string;
  patientNumber?: string;
  appointmentType?: string;
};

export type AppointmentResponseModel = {
  items: AppointmentModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
  summaryCount: number;
  hasDateFilter: boolean;
};

export type AppointmentStateModel = {
  items: AppointmentModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  selectedItem?: AppointmentModel;
  clinicId?: string | null;
  summaryCount: number;
  hasDateFilter: boolean;
};

export type AppointmentStateProps = {
  state: AppointmentStateModel;
  setState: Function;
  clinicId?: string | null;
  onReload?: () => void;
};

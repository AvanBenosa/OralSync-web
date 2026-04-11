export type PatientProps = {
  clinicId?: string;
};

export type PatientModel = {
  id?: string;
  clinicProfileId?: string | null;
  createdBranchId?: string | null;
  patientNumber?: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  emailAddress?: string;
  birthDate?: Date;
  contactNumber?: string;
  address?: string;
  gender?: string;
  occupation?: string;
  religion?: string;
  civilStatus?: string;
};

export type PatientResponseModel = {
  items: PatientModel[];
  pageStart: number;
  pageEnd: number;
  totalCount: number;
};

export type PatientUploadResultModel = {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: string[];
};

export type PatientSortField = 'createdAt' | 'lastName';

export type PatientSortDirection = 'asc' | 'desc';

export type PatientStateModel = {
  items: PatientModel[];
  load: boolean;
  initial: number;
  totalItem: number;
  pageStart: number;
  pageEnd: number;
  search?: string;
  sortBy: PatientSortField;
  sortDirection: PatientSortDirection;

  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  upload: boolean;
  selectedItem?: PatientModel;
  clinicProfileId?: string | null;
};

export type PatientStateProps = {
  state: PatientStateModel;
  setState: Function;
  onReload?: () => void;
};

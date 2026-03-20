import {
  RegisterEmploymentType,
  RegisterPrefix,
  RegisterSuffix,
  RegisterUserRole,
} from '../../../register/api/types';

export type SettingsUserModel = {
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  emailAddress?: string;
  birthDate?: string;
  contactNumber?: string;
  address?: string;
  suffix?: RegisterSuffix;
  preffix?: RegisterPrefix;
  religion?: string;
  startDate?: string;
  employmentType?: RegisterEmploymentType;
  bio?: string;
  role?: RegisterUserRole;
  roleLabel?: string;
  clinicId?: string | null;
  isActive?: boolean;
};

export type SettingsUserResponseModel = {
  items: SettingsUserModel[];
  totalCount: number;
};

export type CreateUserFormValues = {
  id?: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  emailAddress: string;
  birthDate: string;
  contactNumber: string;
  address: string;
  suffix: RegisterSuffix;
  preffix: RegisterPrefix;
  religion: string;
  startDate: string;
  employmentType: RegisterEmploymentType;
  bio: string;
  role: RegisterUserRole;
  password: string;
  confirmPassword: string;
  isActive: boolean;
};

export type CreateUserStateModel = {
  items: SettingsUserModel[];
  item: SettingsUserModel | null;
  load: boolean;
  isUpdate: boolean;
  isDelete: boolean;
  search: string;
  totalItem: number;
  clinicId?: string | null;
};

export type CreateUserStateProps = {
  state: CreateUserStateModel;
  setState: Function;
  onReload?: () => void;
};

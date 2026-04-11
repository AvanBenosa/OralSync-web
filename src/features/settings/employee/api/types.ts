import type { Dispatch, SetStateAction } from 'react';

import { REGISTER_PREFIX_OPTIONS, RegisterPrefix } from '../../../register/api/types';

export enum EmployeeRole {
  None = 0,
  Doctor = 1,
  Receptionist = 2,
}

export const EMPLOYEE_ROLE_OPTIONS = [
  { value: EmployeeRole.None, label: 'Select Role' },
  { value: EmployeeRole.Doctor, label: 'Doctor' },
  { value: EmployeeRole.Receptionist, label: 'Receptionist' },
];

export const EMPLOYEE_PREFIX_OPTIONS = REGISTER_PREFIX_OPTIONS;

export type EmployeeModel = {
  id?: string;
  clinicProfileId?: string | null;
  profilePicture?: string;
  emailAddress?: string;
  firstName?: string;
  preffix?: RegisterPrefix;
  role?: EmployeeRole;
  lastName?: string;
  middleName?: string;
  contactNumber?: string;
  address?: string;
};

export type EmployeeResponseModel = {
  items: EmployeeModel[];
  totalCount: number;
};

export type EmployeeFormValues = {
  id?: string;
  profilePicture: string;
  emailAddress: string;
  firstName: string;
  preffix: RegisterPrefix;
  role: EmployeeRole;
  lastName: string;
  middleName: string;
  contactNumber: string;
  address: string;
};

export type EmployeeStateModel = {
  items: EmployeeModel[];
  selectedItem: EmployeeModel | null;
  load: boolean;
  totalItem: number;
  clinicId?: string | null;
  openModal: boolean;
  isUpdate: boolean;
  isDelete: boolean;
};

export type EmployeeStateProps = {
  state: EmployeeStateModel;
  setState: Dispatch<SetStateAction<EmployeeStateModel>>;
};

export const getEmployeeItemKey = (item?: EmployeeModel | null): string =>
  item?.id?.trim() || `${item?.firstName?.trim() || ''}::${item?.lastName?.trim() || ''}`;

export const getEmployeeRoleLabel = (role?: EmployeeRole | number | null): string =>
  EMPLOYEE_ROLE_OPTIONS.find((option) => option.value === role)?.label || 'Unassigned';

export const getEmployeePrefixLabel = (preffix?: RegisterPrefix | number | null): string =>
  EMPLOYEE_PREFIX_OPTIONS.find((option) => option.value === preffix)?.label || 'None';

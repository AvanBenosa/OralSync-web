export enum RegisterUserRole {
  SuperAdmin = 0,
  Dentist = 1,
  Assistant = 2,
  Receptionist = 3,
  User = 4,
  BranchAdmin = 5,
}

export enum RegisterEmploymentType {
  None = 0,
  Permanent = 1,
  OnCall = 2,
}

export enum RegisterPrefix {
  None = 0,
  Doctor = 1,
}

export enum RegisterSuffix {
  None = 0,
}

export const REGISTER_ROLE_OPTIONS = [
  { value: RegisterUserRole.SuperAdmin, label: 'Super Admin' },
  { value: RegisterUserRole.Dentist, label: 'Dentist' },
  { value: RegisterUserRole.Assistant, label: 'Assistant' },
  { value: RegisterUserRole.Receptionist, label: 'Receptionist' },
  { value: RegisterUserRole.User, label: 'User' },
  { value: RegisterUserRole.BranchAdmin, label: 'Branch Admin' },
];

export const REGISTER_EMPLOYMENT_OPTIONS = [
  { value: RegisterEmploymentType.None, label: 'None' },
  { value: RegisterEmploymentType.Permanent, label: 'Permanent' },
  { value: RegisterEmploymentType.OnCall, label: 'On Call' },
];

export const REGISTER_PREFIX_OPTIONS = [
  { value: RegisterPrefix.None, label: 'None' },
  { value: RegisterPrefix.Doctor, label: 'Doctor' },
];

export const REGISTER_SUFFIX_OPTIONS = [{ value: RegisterSuffix.None, label: 'None' }];

export type RegisterFormValues = {
  userName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
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
  clinicName: string;
  clinicAddress: string;
  clinicEmailAddress: string;
  clinicContactNumber: string;
  password: string;
  confirmPassword: string;
};

export type PublicClinicRegistrationFormValues = Omit<RegisterFormValues, 'role'> & {
  verificationCode: string;
};

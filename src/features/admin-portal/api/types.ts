export type AdminPortalProps = {
  currentUserName?: string;
};

export type AdminDashboardClinicModel = {
  id?: string;
  clinicName?: string;
  doctorCount?: number;
  patientCount?: number;
  isLocked?: boolean;
  isDataPrivacyAccepted?: boolean;
};

export type AdminDashboardPatientTrendClinicModel = {
  clinicName?: string;
  patientCount?: number;
};

export type AdminDashboardPatientTrendModel = {
  date?: string;
  label?: string;
  clinics: AdminDashboardPatientTrendClinicModel[];
};

export type AdminDashboardOwnerModel = {
  name?: string;
  clinicName?: string;
  emailAddress?: string;
  contactNumber?: string;
};

export type AdminDashboardModel = {
  totalClinics: number;
  totalDoctors: number;
  totalPatients: number;
  clinics: AdminDashboardClinicModel[];
  dailyPatientTrends: AdminDashboardPatientTrendModel[];
  owners: AdminDashboardOwnerModel[];
};

export type AdminClinicModel = {
  id?: string;
  clinicName?: string;
  address?: string;
  emailAddress?: string;
  contactNumber?: string;
  subscriptionType?: string;
  validityDate?: string;
  isLocked?: boolean;
  isDataPrivacyAccepted?: boolean;
  createdAt?: string;
  ownerName?: string;
  totalUsers?: number;
};

export type AdminClinicLockRequest = {
  clinicId: string;
  isLocked: boolean;
  subscriptionType?: string;
  validityDate?: string;
};

export type AdminUserModel = {
  id?: string;
  userName?: string;
  name?: string;
  emailAddress?: string;
  clinicId?: string | null;
  clinicName?: string;
  roleLabel?: string;
  isActive?: boolean;
};

export type AdminClinicsStateModel = {
  items: AdminClinicModel[];
  load: boolean;
  error: string;
};

export type AdminDashboardStateModel = {
  item: AdminDashboardModel | null;
  load: boolean;
  error: string;
};

export type AdminUsersStateModel = {
  items: AdminUserModel[];
  load: boolean;
  error: string;
};

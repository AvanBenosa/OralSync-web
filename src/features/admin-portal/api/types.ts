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

export type AdminClinicSubscriptionHistoryModel = {
  id?: string;
  clinicId?: string;
  paymentDate?: string | Date;
  subscriptionType?: string;
  totalAmount?: number;
};

export type AdminClinicSubscriptionHistoryRequest = {
  id?: string;
  clinicId: string;
  paymentDate?: string;
  subscriptionType: string;
  totalAmount: number;
};

export type AdminClinicSubscriptionHistoryDeleteRequest = {
  id: string;
  clinicId: string;
};

export type AdminClinicManualPaymentModel = {
  id?: string;
  clinicId?: string;
  clinicName?: string;
  amount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
  senderName?: string;
  proofImageUrl?: string;
  status?: string;
  submittedAt?: string | Date;
  verifiedAt?: string | Date | null;
  verifiedBy?: string;
  rejectionReason?: string;
  subscriptionType?: string;
  subscriptionMonths?: number;
};

export type AdminClinicManualPaymentStatusRequest = {
  id: string;
  clinicId: string;
  status: string;
  rejectionReason?: string;
};

export type AdminManualPaymentRequestsFilter = {
  clinicId?: string;
  status?: string;
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

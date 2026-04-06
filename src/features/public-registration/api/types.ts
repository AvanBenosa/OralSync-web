export type PublicClinicRegistrationContextModel = {
  clinicId: string;
  clinicName: string;
  bannerImagePath?: string;
  address?: string;
  emailAddress?: string;
  contactNumber?: string;
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
  isLocked: boolean;
};

export type PublicPatientAppointmentRegistrationPayload = {
  clinicId: string;
  existingPatientId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  emailAddress?: string;
  emailVerificationCode?: string;
  birthDate?: string;
  contactNumber?: string;
  appointmentDateFrom: string;
  appointmentDateTo: string;
  reasonForVisit: string;
  remarks?: string;
};

export type PublicPatientAppointmentRegistrationResponse = {
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientNumber: string;
  appointmentId: string;
  appointmentDateFrom: string;
  appointmentDateTo: string;
};

export type PublicExistingPatientLookupPayload = {
  clinicId: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
};

export type PublicExistingPatientLookupResponse = {
  patientId: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
};

export type PublicEmailVerificationCodePayload = {
  clinicId: string;
  emailAddress: string;
};

export type PublicEmailVerificationCodeResponse = {
  email: string;
  expiresInMinutes: number;
};

export type PublicEmailVerificationStatusPayload = {
  clinicId: string;
  emailAddress: string;
  verificationCode: string;
};

export type PublicEmailVerificationStatusResponse = {
  email: string;
  verified: boolean;
};

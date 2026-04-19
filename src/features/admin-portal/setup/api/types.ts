export const ActiveSMSConfig = {
  AndroidSmsGateway: 1,
  Semaphore: 2,
} as const;

export type ActiveSMSConfigValue = (typeof ActiveSMSConfig)[keyof typeof ActiveSMSConfig];

export type SetupModel = {
  activeSMSConfig: ActiveSMSConfigValue;
  activeSMSConfigLabel: string;
  showBetaTestingDialog: boolean;
};

export type UpdateSetupRequest = {
  activeSMSConfig: ActiveSMSConfigValue;
  showBetaTestingDialog: boolean;
};

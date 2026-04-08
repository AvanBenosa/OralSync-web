export enum SubscriptionPlan {
  Basic = 'Basic',
  Standard = 'Standard',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Expired = 'Expired',
}

export enum PaymentChannel {
  PayMongo = 'PayMongo',
  Manual = 'Manual',
}

export enum ManualPaymentMethod {
  GCash = 'GCash',
  BankTransfer = 'Bank Transfer',
}

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]: 'Basic',
  [SubscriptionPlan.Standard]: 'Standard',
};

export const PAYMENT_CHANNEL_LABELS: Record<PaymentChannel, string> = {
  [PaymentChannel.PayMongo]: 'PayMongo',
  [PaymentChannel.Manual]: 'Manual Payment',
};

export const MANUAL_PAYMENT_METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  [ManualPaymentMethod.GCash]: 'GCash',
  [ManualPaymentMethod.BankTransfer]: 'Bank Transfer',
};

export const SUBSCRIPTION_MONTHS_OPTIONS = [1, 3, 6, 12] as const;
export type SubscriptionMonths = (typeof SUBSCRIPTION_MONTHS_OPTIONS)[number];

export const PRICING_TABLE: Record<SubscriptionPlan, Record<SubscriptionMonths, number>> = {
  [SubscriptionPlan.Basic]: { 1: 450, 3: 1200, 6: 2400, 12: 4500 },
  [SubscriptionPlan.Standard]: { 1: 800, 3: 2100, 6: 3900, 12: 7200 },
};

export const MONTHS_LABEL: Record<SubscriptionMonths, string> = {
  1: '1 Month',
  3: '3 Months',
  6: '6 Months',
  12: '12 Months',
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  [SubscriptionPlan.Basic]: [
    'Up to 2 users',
    'Patient records up to 1,000',
    'Store up to 500 patient photos/files',
    'No SMS reminders included',
    'No email notifications included',
    'Inventory module not included',
  ],
  [SubscriptionPlan.Standard]: [
    'Up to 5 users',
    'Patient records up to 1,000',
    'Store up to 1,000 patient photos/files',
    'SMS reminders with monthly usage limits',
    'Email notifications included',
    'Inventory module included',
  ],
};

export type PaymentTransactionModel = {
  id?: string;
  clinicProfileId?: string;
  paymentChannel?: PaymentChannel | string;
  paymentMethod?: string;
  payMongoLinkId?: string;
  payMongoReferenceNumber?: string;
  checkoutUrl?: string;
  referenceNumber?: string;
  senderName?: string;
  proofImageUrl?: string;
  amount?: number;
  subscriptionType?: SubscriptionPlan;
  subscriptionMonths?: number;
  status?: PaymentStatus | string;
  paidAt?: string | null;
  submittedAt?: string | null;
  expiresAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
};

export type ManualPaymentFormModel = {
  paymentMethod: ManualPaymentMethod | '';
  senderName: string;
  referenceNumber: string;
  proofImageUrl: string;
  proofFileName: string;
};

export type SubscriptionProps = {
  clinicId?: string;
};

export type SubscriptionStateModel = {
  step: 'plans' | 'checkout' | 'polling' | 'success';
  selectedPlan: SubscriptionPlan | null;
  selectedMonths: SubscriptionMonths;
  paymentChannel: PaymentChannel;
  manualPayment: ManualPaymentFormModel;
  transaction: PaymentTransactionModel | null;
  isSubmitting: boolean;
  isUploadingProof: boolean;
  pollCount: number;
  errorMessage?: string | null;
};

export type SubscriptionStateProps = {
  state: SubscriptionStateModel;
  setState: Function;
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export const getPrice = (plan: SubscriptionPlan, months: SubscriptionMonths): number =>
  PRICING_TABLE[plan][months];

export const isPaidPlan = (plan?: SubscriptionPlan | string | null): boolean =>
  plan === SubscriptionPlan.Basic ||
  plan === SubscriptionPlan.Standard ||
  plan?.toLowerCase() === 'basic' ||
  plan?.toLowerCase() === 'standard';

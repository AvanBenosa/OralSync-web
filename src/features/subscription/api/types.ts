// ── Enums ─────────────────────────────────────────────────────────────────────

export enum SubscriptionPlan {
  Basic = 'Basic',
  Standard = 'Standard',
  // Premium is disabled — not yet available
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
  Expired = 'Expired',
}

// ── Label / pricing maps ──────────────────────────────────────────────────────

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.Basic]: 'Basic',
  [SubscriptionPlan.Standard]: 'Standard',
};

export const SUBSCRIPTION_MONTHS_OPTIONS = [1, 3, 6, 12] as const;
export type SubscriptionMonths = (typeof SUBSCRIPTION_MONTHS_OPTIONS)[number];

// Pricing in PHP — must match backend PricingTable in CreatePaymentLink/Command.cs
// Basic:    ₱450 / month
// Standard: ₱800 / month
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

// Features must stay in sync with subscriptions.tsx SUBSCRIPTION_PLANS array
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

// ── API models ────────────────────────────────────────────────────────────────

export type PaymentTransactionModel = {
  id?: string;
  clinicProfileId?: string;
  payMongoLinkId?: string;
  payMongoReferenceNumber?: string;
  checkoutUrl?: string;
  amount?: number;
  subscriptionType?: SubscriptionPlan;
  subscriptionMonths?: number;
  status?: PaymentStatus | string;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

// ── State models ──────────────────────────────────────────────────────────────

export type SubscriptionProps = {
  clinicId?: string;
};

export type SubscriptionStateModel = {
  // Step control: 'plans' | 'checkout' | 'polling' | 'success'
  step: 'plans' | 'checkout' | 'polling' | 'success';
  // Both Basic and Standard are selectable paid plans
  selectedPlan: SubscriptionPlan | null;
  selectedMonths: SubscriptionMonths;
  transaction: PaymentTransactionModel | null;
  isSubmitting: boolean;
  pollCount: number;
};

export type SubscriptionStateProps = {
  state: SubscriptionStateModel;
  setState: Function;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export const getPrice = (plan: SubscriptionPlan, months: SubscriptionMonths): number =>
  PRICING_TABLE[plan][months];

export const isPaidPlan = (plan?: SubscriptionPlan | string | null): boolean =>
  plan === SubscriptionPlan.Basic ||
  plan === SubscriptionPlan.Standard ||
  plan?.toLowerCase() === 'basic' ||
  plan?.toLowerCase() === 'standard';

import type { AuthUser } from '../../../common/services/auth-api';
import { GetCurrentClinicProfile } from '../../settings/clinic-profile/api/api';
import type { PaymentTransactionModel } from './types';

const resolveTransactionTimestamp = (
  transaction: PaymentTransactionModel | null | undefined
): string | number => {
  if (!transaction) {
    return Date.now();
  }

  return (
    transaction.paidAt ??
    transaction.verifiedAt ??
    transaction.submittedAt ??
    transaction.createdAt ??
    Date.now()
  );
};

export const applySubscriptionTransactionToUser = (
  user: AuthUser | null | undefined,
  transaction: PaymentTransactionModel | null | undefined
): AuthUser | null => {
  if (!user) {
    return null;
  }

  if (!transaction) {
    return user;
  }

  const { subscriptionType, subscriptionMonths } = transaction;
  const paymentTimestamp = new Date(resolveTransactionTimestamp(transaction));
  const wasLockedBeforePayment = Boolean(user.isLocked);
  const currentValidity = user.validityDate ? new Date(user.validityDate) : null;

  let baseDate = paymentTimestamp;

  if (wasLockedBeforePayment) {
    baseDate = new Date(paymentTimestamp);
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (currentValidity && currentValidity > paymentTimestamp) {
    baseDate = currentValidity;
  }

  baseDate.setMonth(baseDate.getMonth() + (subscriptionMonths ?? 1));

  return {
    ...user,
    subscriptionType: (subscriptionType as string) ?? user.subscriptionType,
    validityDate: baseDate.toISOString(),
    isLocked: false,
  };
};

export const syncSubscriptionTransactionToUser = async (
  user: AuthUser | null | undefined,
  transaction: PaymentTransactionModel | null | undefined
): Promise<AuthUser | null> => {
  const optimisticUser = applySubscriptionTransactionToUser(user, transaction);

  if (!optimisticUser) {
    return null;
  }

  try {
    const clinicProfile = await GetCurrentClinicProfile(user?.clinicId, true);

    return {
      ...optimisticUser,
      subscriptionType: clinicProfile.subscriptionType || optimisticUser.subscriptionType,
      validityDate: clinicProfile.validityDate || optimisticUser.validityDate,
      isLocked: false,
    };
  } catch {
    return optimisticUser;
  }
};

export const applyPaidTransactionToUser = applySubscriptionTransactionToUser;
export const syncPaidTransactionToUser = syncSubscriptionTransactionToUser;

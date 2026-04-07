import type { AuthUser } from '../../../common/services/auth-api';
import type { PaymentTransactionModel } from './types';
import { GetCurrentClinicProfile } from '../../settings/clinic-profile/api/api';

export const applyPaidTransactionToUser = (
  user: AuthUser | null | undefined,
  transaction: PaymentTransactionModel | null | undefined
): AuthUser | null => {
  if (!user) {
    return null;
  }

  if (!transaction) {
    return user;
  }

  const { subscriptionType, subscriptionMonths, paidAt } = transaction;
  const paymentTimestamp = new Date(paidAt ?? Date.now());
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

export const syncPaidTransactionToUser = async (
  user: AuthUser | null | undefined,
  transaction: PaymentTransactionModel | null | undefined
): Promise<AuthUser | null> => {
  const optimisticUser = applyPaidTransactionToUser(user, transaction);

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

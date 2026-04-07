import { createPaymentLink, getPaymentStatus } from './api';
import type { PaymentTransactionModel, SubscriptionMonths, SubscriptionStateModel } from './types';
import { SubscriptionPlan } from './types';

export const handleCreatePaymentLink = async (
  plan: SubscriptionPlan.Standard | SubscriptionPlan.Basic,
  months: SubscriptionMonths,
  setState: Function
): Promise<void> => {
  setState((prev: SubscriptionStateModel) => ({ ...prev, isSubmitting: true }));
  try {
    const transaction = await createPaymentLink({
      subscriptionType: plan,
      subscriptionMonths: months,
    });
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      transaction,
      step: 'checkout',
      isSubmitting: false,
    }));
  } catch {
    setState((prev: SubscriptionStateModel) => ({ ...prev, isSubmitting: false }));
  }
};

export const handlePollPaymentStatus = async (
  transaction: PaymentTransactionModel,
  setState: Function
): Promise<void> => {
  if (!transaction.payMongoLinkId) return;
  try {
    const updated = await getPaymentStatus(transaction.payMongoLinkId);
    setState((prev: SubscriptionStateModel) => {
      const isPaid = updated.status === 'Paid';
      const isExpired = updated.status === 'Expired' || updated.status === 'Failed';
      return {
        ...prev,
        transaction: updated,
        pollCount: prev.pollCount + 1,
        step: isPaid ? 'success' : isExpired ? 'plans' : prev.step,
      };
    });
  } catch {
    // Silent — polling continues
  }
};

import {
  createManualPayment,
  createPaymentLink,
  getManualPaymentStatus,
  getPaymentStatus,
  isLocalPaymentSimulationEnabled,
  simulateLocalPayment,
  uploadManualPaymentProof,
} from './api';
import type {
  ManualPaymentFormModel,
  PaymentTransactionModel,
  SubscriptionMonths,
  SubscriptionStateModel,
} from './types';
import { SubscriptionPlan } from './types';

export const handleCreatePaymentLink = async (
  plan: SubscriptionPlan.Standard | SubscriptionPlan.Basic,
  months: SubscriptionMonths,
  setState: Function
): Promise<void> => {
  setState((prev: SubscriptionStateModel) => ({
    ...prev,
    isSubmitting: true,
    errorMessage: null,
  }));

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

export const handleCreateManualPayment = async (
  plan: SubscriptionPlan.Standard | SubscriptionPlan.Basic,
  months: SubscriptionMonths,
  manualPayment: ManualPaymentFormModel,
  setState: Function
): Promise<void> => {
  setState((prev: SubscriptionStateModel) => ({
    ...prev,
    isSubmitting: true,
    errorMessage: null,
  }));

  try {
    const transaction = await createManualPayment({
      subscriptionType: plan,
      subscriptionMonths: months,
      paymentMethod: manualPayment.paymentMethod,
      referenceNumber: manualPayment.referenceNumber,
      senderName: manualPayment.senderName,
      proofImageUrl: manualPayment.proofImageUrl,
    });

    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      transaction,
      step: 'success',
      isSubmitting: false,
    }));
  } catch {
    setState((prev: SubscriptionStateModel) => ({ ...prev, isSubmitting: false }));
  }
};

export const handleUploadManualPaymentProof = async (
  file: File,
  oldFilePath: string | undefined,
  setState: Function
): Promise<void> => {
  setState((prev: SubscriptionStateModel) => ({
    ...prev,
    isUploadingProof: true,
    errorMessage: null,
  }));

  try {
    const response = await uploadManualPaymentProof(file, oldFilePath);

    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      isUploadingProof: false,
      manualPayment: {
        ...prev.manualPayment,
        proofImageUrl: response.filePath,
        proofFileName: file.name,
      },
    }));
  } catch {
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      isUploadingProof: false,
      errorMessage: 'Unable to upload proof of payment.',
    }));
  }
};

export const handlePollPaymentStatus = async (
  transaction: PaymentTransactionModel,
  setState: Function
): Promise<void> => {
  if (!transaction.payMongoLinkId) {
    return;
  }

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
    // Silent polling fallback keeps the user on the same screen.
  }
};

export const handleGetManualPaymentStatus = async (setState: Function): Promise<void> => {
  try {
    const transaction = await getManualPaymentStatus();
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      transaction,
    }));
  } catch {
    // Latest manual payment is optional context only.
  }
};

export const handleStartPaymentStatusCheck = async (
  transaction: PaymentTransactionModel,
  setState: Function
): Promise<void> => {
  const shouldSimulateLocalPayment =
    Boolean(transaction.payMongoLinkId) && isLocalPaymentSimulationEnabled();

  setState((prev: SubscriptionStateModel) => ({
    ...prev,
    step: 'polling',
    pollCount: 0,
    isSubmitting: shouldSimulateLocalPayment,
  }));

  if (!shouldSimulateLocalPayment || !transaction.payMongoLinkId) {
    return;
  }

  try {
    const updated = await simulateLocalPayment(transaction.payMongoLinkId);
    setState((prev: SubscriptionStateModel) => {
      const isPaid = updated.status === 'Paid';
      const isExpired = updated.status === 'Expired' || updated.status === 'Failed';

      return {
        ...prev,
        transaction: updated,
        pollCount: prev.pollCount + 1,
        step: isPaid ? 'success' : isExpired ? 'plans' : 'polling',
        isSubmitting: false,
      };
    });
  } catch {
    setState((prev: SubscriptionStateModel) => ({
      ...prev,
      isSubmitting: false,
    }));
  }
};

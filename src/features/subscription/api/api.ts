import { isAxiosError } from 'axios';
import { ExceptionResponse, ResponseMethod, SuccessResponse } from '../../../common/api/responses';
import { apiClient } from '../../../common/services/api-client';
import type { PaymentTransactionModel } from './types';

const CREATE_LINK_ENDPOINT  = '/api/dmd/payments/create-payment-link';
const STATUS_ENDPOINT       = '/api/dmd/payments/status';

// ── Create payment link ───────────────────────────────────────────────────────

export type CreatePaymentLinkRequest = {
  subscriptionType: string;
  subscriptionMonths: number;
};

export const createPaymentLink = async (
  request: CreatePaymentLinkRequest
): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.post<PaymentTransactionModel>(CREATE_LINK_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

// ── Poll payment status ───────────────────────────────────────────────────────

export const getPaymentStatus = async (
  linkId: string
): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.get<PaymentTransactionModel>(STATUS_ENDPOINT, {
      params: { LinkId: linkId },
    });
    return SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) await ExceptionResponse(error);
    throw error;
  }
};

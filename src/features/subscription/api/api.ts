import { isAxiosError } from 'axios';
import { ExceptionResponse, ResponseMethod, SuccessResponse } from '../../../common/api/responses';
import { apiClient, getApiBaseUrl } from '../../../common/services/api-client';
import type { PaymentTransactionModel } from './types';

const CREATE_LINK_ENDPOINT = '/api/dmd/payments/create-payment-link';
const STATUS_ENDPOINT = '/api/dmd/payments/status';
const SIMULATE_PAID_ENDPOINT = '/api/dmd/payments/simulate-paid';
const CREATE_MANUAL_PAYMENT_ENDPOINT = '/api/dmd/payments/create-manual-payment';
const MANUAL_PAYMENT_STATUS_ENDPOINT = '/api/dmd/payments/manual-payment-status';
const UPLOAD_MANUAL_PAYMENT_PROOF_ENDPOINT = '/api/dmd/payments/upload-manual-payment-proof';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export type CreatePaymentLinkRequest = {
  subscriptionType: string;
  subscriptionMonths: number;
};

export type CreateManualPaymentRequest = {
  subscriptionType: string;
  subscriptionMonths: number;
  paymentMethod: string;
  referenceNumber: string;
  senderName: string;
  proofImageUrl: string;
};

export type ManualPaymentProofUploadResponse = {
  fileName: string;
  filePath: string;
};

export const createPaymentLink = async (
  request: CreatePaymentLinkRequest
): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.post<PaymentTransactionModel>(CREATE_LINK_ENDPOINT, request);
    return SuccessResponse(response, ResponseMethod.Create, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const createManualPayment = async (
  request: CreateManualPaymentRequest
): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.post<PaymentTransactionModel>(
      CREATE_MANUAL_PAYMENT_ENDPOINT,
      request
    );
    return SuccessResponse(response, ResponseMethod.Create, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const getPaymentStatus = async (linkId: string): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.get<PaymentTransactionModel>(STATUS_ENDPOINT, {
      params: { LinkId: linkId },
    });
    return SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const getManualPaymentStatus = async (): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.get<PaymentTransactionModel>(MANUAL_PAYMENT_STATUS_ENDPOINT);
    return SuccessResponse(response, ResponseMethod.Fetch, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const simulateLocalPayment = async (linkId: string): Promise<PaymentTransactionModel> => {
  try {
    const response = await apiClient.post<PaymentTransactionModel>(SIMULATE_PAID_ENDPOINT, {
      linkId,
    });
    return SuccessResponse(response, ResponseMethod.Create, undefined, false) as PaymentTransactionModel;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const uploadManualPaymentProof = async (
  file: File,
  oldFilePath?: string
): Promise<ManualPaymentProofUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (oldFilePath?.trim()) {
      formData.append('oldFilePath', oldFilePath);
    }

    const response = await apiClient.post<ManualPaymentProofUploadResponse>(
      UPLOAD_MANUAL_PAYMENT_PROOF_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      await ExceptionResponse(error);
    }
    throw error;
  }
};

export const isLocalPaymentSimulationEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const apiBaseUrl = getApiBaseUrl()?.trim();

  if (!apiBaseUrl) {
    return LOCAL_HOSTS.has(window.location.hostname);
  }

  try {
    const resolvedApiUrl = new URL(apiBaseUrl, window.location.origin);
    return LOCAL_HOSTS.has(resolvedApiUrl.hostname);
  } catch {
    return LOCAL_HOSTS.has(window.location.hostname);
  }
};

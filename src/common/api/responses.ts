import { AxiosError, AxiosResponse } from 'axios';
import { toast, ToastOptions } from 'react-toastify';

export const toastConfig: ToastOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export enum ResponseMethod {
  Delete = 'Deleted',
  Create = 'Created',
  Update = 'Updated',
  Uploaded = 'Uploaded',
  Fetch = 'Get',
}

type ApiErrorPayload = {
  errors?: Record<string, string[] | string>;
};

type Callback = () => void;

const extractErrorMessage = async (error: AxiosError): Promise<string> => {
  if (!error.response) {
    return 'Server unreachable.';
  }

  const responseData = error.response.data;

  if (typeof responseData === 'string') {
    if (responseData.includes('time out')) {
      return 'Connection error: Unable to process request';
    }

    if (responseData.trim() !== '') {
      return responseData;
    }

    return `${error.response.status}: ${error.response.statusText}`;
  }

  if (error.request?.responseType === 'blob' && responseData instanceof Blob && responseData.type) {
    return responseData.text();
  }

  const payload = responseData as ApiErrorPayload;
  if (payload?.errors) {
    const entries = Object.values(payload.errors).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    );
    return entries.join('\n');
  }

  return 'Unable to process request.';
};

export const successResponse = <T>(
  response: AxiosResponse<T>,
  method?: ResponseMethod,
  callback?: Callback,
  withToast: boolean = true
): T | undefined => {
  if (response.data) {
    method !== ResponseMethod.Fetch &&
      withToast &&
      toast.success(`Successfully ${method}!`, toastConfig);
    callback?.();
    return response.data;
  }
};

export const customSuccessResponse = <T>(
  response: AxiosResponse<T>,
  text: string,
  callback?: Callback
): T | undefined => {
  if (response.data) {
    if (text !== '') toast.success(`Successfully ${text}.`, toastConfig);
    callback?.();
    return response.data;
  }
};

export const exceptionResponse = async (error: AxiosError, callback?: Callback): Promise<void> => {
  const response = error.response;

  if (response?.status === 401 || response?.status === 403) {
    window.location.href = `/unauthorized`;
    callback?.();
    return;
  }

  if (typeof response?.data === 'string' && response.data.includes('Padding is invalid')) {
    window.location.assign('/');
    callback?.();
    return;
  }

  const message = await extractErrorMessage(error);
  toast.error(message, toastConfig);
  callback?.();
};

export const toastError = (message: string): void => {
  toast.error(message, toastConfig);
};

export const toastSuccess = (message: string): void => {
  toast.success(message, toastConfig);
};

// Backward-compatible exports for existing callers.
export const SuccessResponse = successResponse;
export const CustomSuccessResponse = customSuccessResponse;
export const ExceptionResponse = exceptionResponse;

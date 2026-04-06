import { apiClient } from './api-client';

export type AiAssistantRole = 'user' | 'assistant';

export type AiAssistantMessage = {
  role: AiAssistantRole;
  content: string;
};

export type AiAssistantRequest = {
  patientId?: string;
  routeContext?: string;
  messages: AiAssistantMessage[];
};

export type AiAssistantResponse = {
  reply: string;
  contextLabel: string;
  model: string;
  usedPatientContext: boolean;
};

const AI_ASSISTANT_ENDPOINT = '/api/dmd/ai/chat';

export const sendAiAssistantMessage = async (
  request: AiAssistantRequest
): Promise<AiAssistantResponse> => {
  const response = await apiClient.post<AiAssistantResponse>(AI_ASSISTANT_ENDPOINT, request);
  return response.data;
};

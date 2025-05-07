import type {
  ApiSettings,
  MessageGateway,
  Template,
  SingleMessagePayload,
  BulkMessageCsv,
  BulkMessageCsvDetails,
  AuthResponse,
  User,
} from "./types";

export const DEFAULT_BASE_URL = "https://mesagoo-api.onrender.com/api/v1";

export function getApiSettings(): ApiSettings {
  return {
    baseUrl: localStorage.getItem("sms_gateway_base_url") || DEFAULT_BASE_URL,
    bearerToken: localStorage.getItem("sms_gateway_bearer_token") || "",
  };
}

export function setApiBaseUrl(baseUrl: string): void {
  localStorage.setItem("sms_gateway_base_url", baseUrl);
}

export async function handleApiResponse(response: Response): Promise<any> {
  if (response.status === 401) {
    logout();

    window.dispatchEvent(new Event("session-expired"));

    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { baseUrl } = getApiSettings();

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Login failed: ${response.status}`);
  }

  const result = await response.json();

  localStorage.setItem("sms_gateway_bearer_token", result.token);
  localStorage.setItem("sms_gateway_user", JSON.stringify(result.user));

  return result;
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem("sms_gateway_user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem("sms_gateway_bearer_token");
  localStorage.removeItem("sms_gateway_user");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("sms_gateway_bearer_token");
}

export async function fetchMessageGateways(): Promise<MessageGateway[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/message-gateways`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function fetchTemplates(): Promise<Template[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function fetchTemplate(id: string): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function createTemplate(
  template: Partial<Template>
): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(template),
  });

  return handleApiResponse(response);
}

export async function updateTemplate(
  id: string,
  template: Partial<Template>
): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(template),
  });

  return handleApiResponse(response);
}

export async function deleteTemplate(id: string): Promise<void> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function fetchSenders(): Promise<any[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/senders`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function sendSingleMessage(
  payload: SingleMessagePayload
): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/messages/single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

export async function verifyMessage(messageId: string): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/messages/single/${messageId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function sendBulkMessages(formData: FormData): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/bulk-message-csvs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
    body: formData,
  });

  return handleApiResponse(response);
}

export async function fetchBulkMessageCsvs(
  params: Record<string, any> = {}
): Promise<BulkMessageCsvDetails[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";

  const response = await fetch(`${baseUrl}/bulk-message-csvs${queryString}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
    },
  });

  return handleApiResponse(response);
}

export async function processBulkMessageCsv(
  bulkMessageCsvId: string | number
): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(
    `${baseUrl}/bulk-message-csvs/${bulkMessageCsvId}/process`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  );

  return handleApiResponse(response);
}

export async function getBulkMessageCsvStatus(
  bulkMessageCsvId: string | number
): Promise<BulkMessageCsv> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(
    `${baseUrl}/bulk-message-csvs/${bulkMessageCsvId}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
    }
  );

  return handleApiResponse(response);
}

export async function getBulkMessageCsvDetails(
  bulkMessageCsvId: string | number
): Promise<BulkMessageCsvDetails> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(
    `${baseUrl}/bulk-message-csvs/${bulkMessageCsvId}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
    }
  );

  return handleApiResponse(response);
}

export async function validateBulkMessageCsv(
  bulkMessageCsvId: string | number
): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(
    `${baseUrl}/bulk-message-csvs/${bulkMessageCsvId}/validate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
    }
  );

  return handleApiResponse(response);
}

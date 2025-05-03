import type {
  ApiSettings,
  MessageGateway,
  Template,
  SingleMessagePayload,
  BulkMessageCsv,
} from "./types";

export function getApiSettings(): ApiSettings {
  return {
    baseUrl: localStorage.getItem("sms_gateway_base_url") || "",
    bearerToken: localStorage.getItem("sms_gateway_bearer_token") || "",
  };
}

export async function fetchMessageGateways(): Promise<MessageGateway[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/message-gateways`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        `Failed to fetch message gateways: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || [];
}

export async function fetchTemplates(): Promise<Template[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch templates: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || [];
}

export async function fetchTemplate(id: string): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch template: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || {};
}

export async function createTemplate(
  template: Partial<Template>
): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to create template: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || {};
}

export async function updateTemplate(
  id: string,
  template: Partial<Template>
): Promise<Template> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(template),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to update template: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || {};
}

export async function deleteTemplate(id: string): Promise<void> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/templates/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to delete template: ${response.status}`
    );
  }
}

export async function fetchSenders(): Promise<any[]> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/senders`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch senders: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || [];
}

export async function sendSingleMessage(
  payload: SingleMessagePayload
): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/messages/single`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to send message: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || result;
}

export async function verifyMessage(messageId: string): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/messages/single/${messageId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to verify message: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || result;
}

export async function sendBulkMessages(formData: FormData): Promise<any> {
  const { baseUrl, bearerToken } = getApiSettings();

  const response = await fetch(`${baseUrl}/bulk-message-csvs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to send bulk messages: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || result;
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
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        `Failed to process bulk message CSV: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || result;
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
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        `Failed to get bulk message CSV status: ${response.status}`
    );
  }

  const result = await response.json();
  return result.data || result;
}

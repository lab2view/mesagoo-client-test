export interface Environment {
  name: string;
  baseUrl: string;
  endpoints: {
    single: string;
    bulk: string;
  };
}

export interface ApiSettings {
  baseUrl: string;
  bearerToken: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export enum MessageChannelEnum {
  SMS = "sms",
  WHATSAPP = "whatsapp",
  EMAIL = "email",
}

export enum BulkMessageCsvStatusEnum {
  INITIATED = "initiated",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface MessageGateway {
  id: number;
  code: string;
  label: string;
}

export interface Template {
  id: number;
  user_id: number;
  sender_id: number | null;
  code: string;
  label: string;
  text: string;
  data: string[];
  created_at: string;
  updated_at: string;
}

export interface Sender {
  id: number;
  code: string;
  label: string;
}

export interface SingleMessagePayload {
  sender_code: string;
  phone: string;
  message_gateway_code: string;
  channel?: string;
  lang?: string;
  template?: {
    code: string;
    data: Record<string, any>;
  };
  text?: string;
}

export interface FormStatus {
  success: boolean;
  message: string;
}

export interface MessageVerification {
  status: string;
  phone: string;
  message_id: string;
  created_at: string;
}

export interface BulkMessageCsv {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  created_at: string;
  updated_at: string;
}

export interface BulkMessageMapping {
  [key: string]: string | null;
}

export interface BulkMessageCsvDetails {
  id: number;
  text: string;
  channel: string;
  message_gateway_id: number;
  status: string;
  sender_id: number;
  template_id: number | null;
  type: string;
  user_id: number;
  mapping: Record<string, string>;
  summary: any;
  initial_url: string;
  formated_url: string;
  created_at: string;
  updated_at: string;
  message_gateway?: MessageGateway;
  sender?: Sender;
  template?: Template;
  user?: User;
}

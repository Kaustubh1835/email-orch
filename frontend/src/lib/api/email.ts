import apiClient from "./client";
import type {
  EmailGenerateRequest,
  EmailGenerateResponse,
  EmailSendRequest,
  EmailSendResponse,
  EmailListResponse,
  EmailDetail,
  FollowupScheduleRequest,
  FollowupResponse,
  FollowupListResponse,
} from "./types";

export async function generateEmail(
  data: EmailGenerateRequest
): Promise<EmailGenerateResponse> {
  const response = await apiClient.post<EmailGenerateResponse>(
    "/emails/generate",
    data
  );
  return response.data;
}

export async function sendEmail(
  data: EmailSendRequest
): Promise<EmailSendResponse> {
  const response = await apiClient.post<EmailSendResponse>(
    "/emails/send",
    data
  );
  return response.data;
}

export async function getEmails(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<EmailListResponse> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (status) params.status = status;
  const response = await apiClient.get<EmailListResponse>("/emails", {
    params,
  });
  return response.data;
}

export async function getEmailById(id: string): Promise<EmailDetail> {
  const response = await apiClient.get<EmailDetail>(`/emails/${id}`);
  return response.data;
}

export async function scheduleFollowup(
  data: FollowupScheduleRequest
): Promise<FollowupResponse> {
  const response = await apiClient.post<FollowupResponse>("/followups", data);
  return response.data;
}

export async function getFollowups(
  emailId?: string
): Promise<FollowupListResponse> {
  const params: Record<string, string> = {};
  if (emailId) params.email_id = emailId;
  const response = await apiClient.get<FollowupListResponse>("/followups", {
    params,
  });
  return response.data;
}

export async function cancelFollowup(id: string): Promise<void> {
  await apiClient.delete(`/followups/${id}`);
}

// SSE streaming types
export type SSEStepEvent = {
  event: "step";
  step: string;
  status: "started" | "completed";
  data: Record<string, string>;
};

export type SSECompleteEvent = {
  event: "complete";
  email_id: string;
  formatted_email: string;
  intent: string;
  tone: string;
  status: string;
};

export type SSEErrorEvent = {
  event: "error";
  message: string;
};

export type SSEEvent = SSEStepEvent | SSECompleteEvent | SSEErrorEvent;

export async function generateEmailStream(
  data: EmailGenerateRequest,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const response = await fetch(`${baseUrl}/api/v1/emails/generate-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    if (response.status === 403) {
      const err = new Error("upgrade_required") as Error & { status: number };
      err.status = 403;
      throw err;
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop()!;

    for (const part of parts) {
      if (!part.trim()) continue;

      let eventData = "";

      for (const line of part.split("\n")) {
        if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        }
      }

      if (eventData) {
        try {
          const parsed = JSON.parse(eventData);
          onEvent(parsed);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

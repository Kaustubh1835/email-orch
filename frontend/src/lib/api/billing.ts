import apiClient from "./client";
import type {
  CheckoutSessionResponse,
  BillingStatusResponse,
  PortalSessionResponse,
} from "./types";

export async function createCheckoutSession(): Promise<CheckoutSessionResponse> {
  const response = await apiClient.post<CheckoutSessionResponse>(
    "/billing/checkout"
  );
  return response.data;
}

export async function getBillingStatus(): Promise<BillingStatusResponse> {
  const response = await apiClient.get<BillingStatusResponse>(
    "/billing/status"
  );
  return response.data;
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  const response = await apiClient.post<PortalSessionResponse>(
    "/billing/portal"
  );
  return response.data;
}

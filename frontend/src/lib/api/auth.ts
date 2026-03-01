import apiClient from "./client";
import type {
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthTokenResponse,
} from "./types";

export async function register(
  data: AuthRegisterRequest
): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>(
    "/auth/register",
    data
  );
  return response.data;
}

export async function login(
  data: AuthLoginRequest
): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>(
    "/auth/login",
    data
  );
  return response.data;
}

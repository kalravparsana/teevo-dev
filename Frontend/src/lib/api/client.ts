import { apiBaseUrl, isApiMode } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/tokenStorage';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = payload?.error ?? {};
    throw new ApiError(err.code ?? 'REQUEST_FAILED', err.message ?? res.statusText, res.status);
  }
  return payload as T;
}

export function assertApiMode(): void {
  if (!isApiMode) {
    throw new Error('API mode is not configured');
  }
}

// wrapper around fetch for talking to the backend, so every screen can just
// try/catch and show err.message

import { tokenStorage } from './tokenStorage';

// trim trailing slash in case someone pastes the url with one
const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      'The app is not connected to a backend yet - EXPO_PUBLIC_API_URL is missing from .env.',
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth) {
    const idToken = await tokenStorage.getaccessToken();
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Something went wrong. Try again.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

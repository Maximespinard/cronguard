/**
 * Typed fetch wrapper that injects the Clerk session token.
 * All API calls go through the Vite proxy (/api → localhost:3001).
 */

let getTokenFn: (() => Promise<string | null>) | null = null;

/** Called once at app boot to wire in Clerk's getToken */
export function setAuthTokenProvider(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

interface ApiError {
  error: string;
  issues?: Record<string, string[]>;
}

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.error);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as ApiError;
    throw new ApiRequestError(res.status, body);
  }

  return res.json() as Promise<T>;
}

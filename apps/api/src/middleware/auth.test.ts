import { getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getUserId, requireAuth } from './auth.js';

vi.mock('@clerk/express', () => ({
  getAuth: vi.fn(),
}));

const mockedGetAuth = vi.mocked(getAuth);

function createMockReq(): Request {
  return {} as Request;
}

function createMockRes(): Response {
  const res = {
    locals: {} as Record<string, unknown>,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('requireAuth', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = createMockReq();
    res = createMockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('calls next and sets userId when authenticated', () => {
    mockedGetAuth.mockReturnValue({ userId: 'user_123' } as ReturnType<typeof getAuth>);

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals['userId']).toBe('user_123');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 JSON when userId is null', () => {
    mockedGetAuth.mockReturnValue({ userId: null } as ReturnType<typeof getAuth>);

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('passes req to getAuth', () => {
    mockedGetAuth.mockReturnValue({ userId: 'user_456' } as ReturnType<typeof getAuth>);

    requireAuth(req, res, next);

    expect(mockedGetAuth).toHaveBeenCalledWith(req);
  });
});

describe('getUserId', () => {
  it('returns userId when set by requireAuth', () => {
    const res = createMockRes();
    res.locals['userId'] = 'user_789';

    expect(getUserId(res)).toBe('user_789');
  });

  it('throws when requireAuth was not applied', () => {
    const res = createMockRes();

    expect(() => getUserId(res)).toThrow('getUserId called without requireAuth middleware');
  });

  it('throws when userId is not a string', () => {
    const res = createMockRes();
    res.locals['userId'] = 42;

    expect(() => getUserId(res)).toThrow('getUserId called without requireAuth middleware');
  });
});

import { getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware that rejects unauthenticated requests with a JSON 401.
 * Must be applied AFTER clerkMiddleware() in the middleware chain.
 *
 * Sets `res.locals['userId']` for downstream handlers.
 * Use `getUserId(res)` to access the typed value.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.locals['userId'] = userId;
  next();
}

/**
 * Typed accessor for the authenticated user's ID.
 * Throws if called without `requireAuth` middleware in the chain.
 */
export function getUserId(res: Response): string {
  const userId: unknown = res.locals['userId'];

  if (typeof userId !== 'string') {
    throw new Error(
      'getUserId called without requireAuth middleware — this is a programming error',
    );
  }

  return userId;
}

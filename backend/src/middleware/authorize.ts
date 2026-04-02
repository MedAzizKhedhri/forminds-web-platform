import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/AppError';
import { UserRole } from '../utils/constants';

/**
 * Authorization middleware factory.
 * Checks that the authenticated user has one of the allowed roles.
 *
 * @param allowedRoles - The roles permitted to access the route
 * @returns Express middleware
 */
const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required. Please log in first.', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(
        new AppError(
          'You do not have permission to perform this action.',
          403
        )
      );
      return;
    }

    next();
  };
};

export default authorize;

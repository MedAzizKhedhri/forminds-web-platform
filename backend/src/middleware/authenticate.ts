import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { publicKey } from '../config/jwt';
import User from '../models/User';
import AppError from '../utils/AppError';
import { JwtPayload } from '../types';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    // Verify token with RS256 public key
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Token has expired. Please log in again.', 401);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token. Please log in again.', 401);
      }
      throw new AppError('Authentication failed.', 401);
    }

    // Check that user exists and is active
    const user = await User.findById(decoded.userId).select('isActive role email');

    if (!user) {
      throw new AppError('User associated with this token no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

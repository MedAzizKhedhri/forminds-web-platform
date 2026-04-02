import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import multer from 'multer';
import AppError from '../utils/AppError';
import config from '../config';
import { ApiResponse } from '../types';

interface MongoServerError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Array<{ field: string; message: string }> | undefined;

  // AppError (operational errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Multer file upload errors
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum allowed size exceeded.';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }
  // Mongoose validation error
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.entries(err.errors).map(([field, error]) => ({
      field,
      message: error.message,
    }));
  }
  // Mongoose duplicate key error
  else if ((err as MongoServerError).code === 11000) {
    statusCode = 409;
    const keyValue = (err as MongoServerError).keyValue;
    const duplicateField = keyValue ? Object.keys(keyValue)[0] : 'field';
    message = `Duplicate value for "${duplicateField}". This value already exists.`;
  }
  // Mongoose CastError (invalid ObjectId, etc.)
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for "${err.path}": ${err.value}`;
  }
  // Zod validation error
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // JSON parse error from body-parser
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }
  // Unknown errors
  else {
    console.error('[Error]', err);
  }

  const response: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.nodeEnv === 'development' && {
      data: {
        stack: err.stack,
        name: err.name,
      } as unknown as undefined,
    }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;

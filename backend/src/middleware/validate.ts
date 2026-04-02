import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import AppError from '../utils/AppError';

type ValidationSource = 'body' | 'params' | 'query';

/**
 * Creates a validation middleware using a Zod schema.
 *
 * @param schema - The Zod schema to validate against
 * @param source - The request property to validate ('body', 'params', or 'query'). Defaults to 'body'.
 * @returns Express middleware that validates and replaces the request data with parsed output
 */
const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new AppError('Validation failed', 400, fieldErrors));
      } else {
        next(error);
      }
    }
  };
};

export default validate;

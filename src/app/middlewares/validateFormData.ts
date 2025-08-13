import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import ApiError from '../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';

export const validateFormData = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let bodyData: any;

      // যদি multipart/form-data হয়
      if (req.is('multipart/form-data')) {
        if (req.body.data) {
          try {
            bodyData = JSON.parse(req.body.data);
          } catch {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid JSON format in "data" field');
          }
        } else {
          throw new ApiError(StatusCodes.BAD_REQUEST, '"data" field is required in form-data');
        }
      } 
      // যদি application/json হয়
      else if (req.is('application/json')) {
        bodyData = req.body;
      } 
      else {
        throw new ApiError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'Unsupported content type');
      }

      // Zod validation
      schema.parse(bodyData);

      // Parsed data body তে সেট করা
      req.body = bodyData;

      next();
    } catch (err) {
      next(err);
    }
  };
};

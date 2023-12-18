import { RequestHandler } from "express";
import AppError from "../utils/appError";
import * as yup from "yup";

export const validate = (schema: any): RequestHandler => {
  return async (req, res, next) => {
    if (!req.body) {
      return next(new AppError("Empty body is not excepted!", 422));
    }

    try {
      const schemaToValidate = yup.object({
        body: schema,
      });
      await schemaToValidate.validate(
        {
          body: req.body,
        },
        {
          abortEarly: true,
        }
      );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        next(new AppError(error.message, 422));
      }
    }
    next();
  };
};

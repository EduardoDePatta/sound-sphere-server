import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import { CastError } from "mongoose";
import environment from "../constants/environment";
import errors from "../constants/errors";

const sendErrorDev = (error: AppError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  }
  return res.status(error.statusCode).render("error", {
    title: "Something went wrong!",
    msg: error.message,
  });
};

const sendErrorProd = (error: AppError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith("/api")) {
    if (error.isOperational) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }
    return res.status(500).json({
      status: "error",
      msg: "Please try again later.",
    });
  }
  if (error.isOperational) {
    return res.status(error.statusCode).render("error", {
      title: "Something went wrong!",
      msg: error.message,
    });
  }
  return res.status(error.statusCode).render("error", {
    title: "Something went wrong",
    msg: "Please try again later.",
  });
};

const handleCastError = (error: CastError) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  const message = "Invalid Token. Please log in again!";
  return new AppError(message, 401);
};

const handleTokenExpiredError = () => {
  const message = "Your token has expired! Please log in again!";
  return new AppError(message, 401);
};

export default (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  error.statusCode = error.statusCode ?? 500;
  error.status = error.status ?? "error";

  if (process.env.NODE_ENV === environment.DEVELOPMENT) {
    sendErrorDev(error, req, res);
  } else {
    console.log(typeof process.env.NODE_ENV);
    let newError = { ...error };
    newError.message = error.message;

    const { name } = newError;

    if (name === errors.CAST_ERROR) {
      newError = handleCastError(newError as any);
    }
    if (name === errors.JSON_WEBTOKEN_ERROR) {
      newError = handleJsonWebTokenError();
    }
    if (name === errors.TOKEN_EXPIRED_ERROR) {
      newError = handleTokenExpiredError();
    }
    sendErrorProd(newError, req, res);
  }
};

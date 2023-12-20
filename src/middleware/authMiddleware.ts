import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { PasswordResetToken, User } from "../models";
import AppError from "../utils/appError";
import { JwtPayload, verify } from "jsonwebtoken";
import { formatProfile } from "../utils/helper";

export const isValidPasswordResetToken: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, userId } = req.body;

    const resetToken = await PasswordResetToken.findOne({
      owner: userId,
    });

    if (!resetToken) {
      return next(new AppError("Unauthorized access, invalid token!", 403));
    }

    const matched = await resetToken.compareToken(token);

    if (!matched) {
      return next(new AppError("Unauthorized access, invalid token!", 403));
    }

    next();
  }
);

const splitTokenFromRequest = (req: Request) => {
  const { authorization } = req.headers;
  return authorization?.split("Bearer ")[1];
};

export const mustAuth: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = splitTokenFromRequest(req);
    if (!token) {
      return next(new AppError("Unauthorized request!", 403));
    }

    const payload = verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;
    const id = payload.userId;

    const user = await User.findOne({ _id: id, tokens: token });

    if (!user) {
      return next(new AppError("Unauthorized request!", 403));
    }

    req.user = formatProfile(user);

    next();
  }
);

export const isAuth: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = splitTokenFromRequest(req);

    if (token) {
      const payload = verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;
      const id = payload.userId;

      const user = await User.findOne({ _id: id, tokens: token });

      if (!user) {
        return next(new AppError("Unauthorized request!", 403));
      }

      req.user = formatProfile(user);
      req.token = token;
    }

    next();
  }
);

export const isVerified: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user.verified) {
      return next(new AppError("Please, verify your email account!", 403));
    }

    next();
  }
);

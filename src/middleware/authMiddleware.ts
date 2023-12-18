import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { PasswordResetToken, User } from "../models";
import AppError from "../utils/appError";
import { JwtPayload, verify } from "jsonwebtoken";

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

export const mustAuth: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    const token = authorization?.split("Bearer ")[1];

    if (!token) {
      return next(new AppError("Unauthorized request!", 403));
    }

    const payload = verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;
    const id = payload.userId;

    const user = await User.findOne({ _id: id, tokens: token });

    if (!user) {
      return next(new AppError("Unauthorized request!", 403));
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      followings: user.followings.length,
    };

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

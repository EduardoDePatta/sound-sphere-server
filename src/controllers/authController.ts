import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { EmailVerificationToken, User, PasswordResetToken } from "../models";
import { CreateUserRequest, VerifyEmailRequest } from "../@types/user";
import { Email } from "../utils";
import { formatProfile, generateToken } from "../utils/helper";
import AppError from "../utils/appError";
import { isValidObjectId } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { RequestWithFiles } from "../middleware";
import formidable from "formidable";
import cloudinary from "../cloud";

export const createUser: RequestHandler = catchAsync(
  async (req: CreateUserRequest, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(12);

    await EmailVerificationToken.create({
      owner: newUser._id,
      token,
    });

    await new Email(name, email).sendWelcome(token);

    res.status(200).json({
      status: "success",
      message: "User created successfully",
      user: newUser,
    });
  }
);

export const verifyEmail: RequestHandler = catchAsync(
  async (req: VerifyEmailRequest, res: Response, next: NextFunction) => {
    const { token, userId } = req.body;

    const verificationToken = await EmailVerificationToken.findOne({
      owner: userId,
    });

    if (!verificationToken) return next(new AppError("Invalid Token!", 403));

    const matched = await verificationToken?.compareToken(token);

    if (!matched) return next(new AppError("Invalid Token!", 403));

    await User.findByIdAndUpdate(userId, {
      verified: true,
    });

    await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

    res.status(200).json({
      status: "success",
      message: "Your email is verified.",
    });
  }
);

export const sendReVerificationToken: RequestHandler = catchAsync(
  async (req: VerifyEmailRequest, res: Response, next: NextFunction) => {
    const { userId } = req.body;

    if (!isValidObjectId(userId)) {
      return next(new AppError("Invalid request!", 403));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError("Invalid request!", 403));
    }

    if (user.verified) {
      return next(new AppError("Your account is already verified!", 422));
    }

    await EmailVerificationToken.findOneAndDelete({
      owner: userId,
    });

    const token = generateToken(12);

    await EmailVerificationToken.create({
      owner: userId,
      token,
    });

    await new Email(user.name, user.email).sendWelcome(token);

    res.status(200).json({
      message: "Please check your email",
    });
  }
);

export const generateForgetPasswordLink: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("Account not found!", 404));
    }

    await PasswordResetToken.findOneAndDelete({ owner: user._id });

    const token = crypto.randomBytes(36).toString("hex");

    await PasswordResetToken.create({
      owner: user._id,
      token,
    });

    const resetLink = `${process.env.PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`;

    await new Email(user.name, email).sendForgetPasswordLink(resetLink);

    res.status(200).json({
      status: "success",
      message: "Check your registered email",
    });
  }
);
export const grantValid: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
      valid: true,
    });
  }
);

export const updatePassword: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError("Unauthorized access!", 403));
    }

    const matched = await user.comparePassword(password);
    console.log("🚀 ~ file: authController.ts:147 ~ matched:", matched);

    if (matched) {
      return next(new AppError("The new password must be different!", 403));
    }

    user.password = password;
    await user.save();

    await PasswordResetToken.findOneAndDelete({
      owner: user._id,
    });

    await new Email(user.name, user.email).sendPasswordResetSuccess();

    res.status(200).json({
      status: "success",
      valid: true,
    });
  }
);

export const signIn: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password, email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return next(new AppError("Email/Password mismatch!", 403));

    const matched = await user.comparePassword(password);

    if (!matched) return next(new AppError("Email/Password mismatch!", 403));

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET ?? ""
    );

    user.tokens.push(token);

    await user.save();

    res.status(200).json({
      status: "success",
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar?.url,
        followers: user.followers.length,
        followings: user.followings.length,
      },
      token,
    });
  }
);

export const sendProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
      profile: req.user,
    });
  }
);

export const updateProfile: RequestHandler = catchAsync(
  async (req: RequestWithFiles, res: Response, next: NextFunction) => {
    const { name } = req.body;
    const avatar = req.files?.avatar as formidable.File;

    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError("Something went wrong. User not found!", 404));
    }
    if (typeof name !== "string") {
      return next(new AppError("Invalid name!", 422));
    }
    if (name.trim().length < 3) {
      return next(new AppError("Invalid name!", 422));
    }

    user.name = name;

    if (avatar) {
      if (user.avatar?.publicId) {
        await cloudinary.uploader.destroy(user.avatar?.publicId);
      }
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        avatar.filepath,
        {
          width: 300,
          height: 300,
          crop: "thumb",
          gravity: "face",
        }
      );

      user.avatar = {
        url: secure_url,
        publicId: public_id,
      };
    }

    await user.save();

    res.status(200).json({
      status: "success",
      profile: formatProfile(user),
    });
  }
);

export const logOut: RequestHandler = catchAsync(
  async (req: RequestWithFiles, res: Response, next: NextFunction) => {
    const { fromAll } = req.query;
    const token = req.token;
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError("Something went wrong. User not found!", 404));
    }
    if (fromAll === "yes") {
      user.tokens = [];
    } else {
      user.tokens = user.tokens.filter((t) => t !== token);
    }

    await user.save();

    res.status(200).json({
      status: "success",
    });
  }
);

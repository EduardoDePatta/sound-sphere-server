import { Request } from "express";
import { CategoriesTypes } from "../utils/audioCategory";
import { RequestWithFiles } from "../middleware";

export interface CreateUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest extends Request {
  body: {
    userId: string;
    token: string;
  };
}

export interface CreateAudioRequest extends RequestWithFiles {
  body: {
    title: string;
    about: string;
    category: CategoriesTypes;
  };
}

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        avatar?: string;
        followers: number;
        followings: number;
      };
      token: string;
    }
  }
}

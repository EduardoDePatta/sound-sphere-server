import { UserDocument } from "../models";

export const generateToken = (length: number) => {
  let token = "";
  for (let i = 0; i < length; i++) {
    const digit = Math.floor(Math.random() * 10);
    token += digit;
  }
  return token;
};

export const formatProfile = (user: UserDocument) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    avatar: user.avatar?.url,
    followers: user.followers.length,
    followings: user.followings.length,
  };
};

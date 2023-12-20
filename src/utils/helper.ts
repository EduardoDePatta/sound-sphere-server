import { PopulatedFavoriteList } from "../@types/audio";
import { UserDocument } from "../models";
import { AudioDocument } from "../models/audio";

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

export const formatAudio = (
  audio: AudioDocument<Pick<UserDocument, "name" | "_id">>
) => {
  return {
    id: audio._id,
    title: audio.title,
    about: audio.about,
    category: audio.category,
    file: audio.file.url,
    poster: audio.poster?.url,
    owner: {
      name: audio.owner.name,
      id: audio.owner._id,
    },
  };
};

import { Request } from "express";
import { UserDocument } from "../models";
import { AudioDocument } from "../models/audio";
import History from "../models/history";
import moment from "moment";

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

export const getUsersPreviousHistory = async (
  req: Request
): Promise<string[]> => {
  const { user } = req;

  const [result] = await History.aggregate([
    {
      $match: {
        owner: user.id,
      },
    },
    {
      $unwind: "$all",
    },
    {
      $match: {
        "all.date": {
          $gte: moment().subtract(30, "days").toDate(),
        },
      },
    },
    {
      $group: {
        _id: "$all.audio",
      },
    },
    {
      $lookup: {
        from: "audios",
        localField: "_id",
        foreignField: "_id",
        as: "audioData",
      },
    },
    {
      $unwind: "$audioData",
    },
    {
      $group: {
        _id: null,
        category: {
          $addToSet: "$audioData.category",
        },
      },
    },
  ]);

  if (result) {
    return result.category;
  }

  return [];
};

import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { ObjectId, isValidObjectId } from "mongoose";
import AppError from "../utils/appError";
import { User } from "../models";
import { PaginationQuery } from "../@types/misc";
import Audio, { AudioDocument } from "../models/audio";
import Playlist from "../models/playlist";

type FollowerStatus = "added" | "removed";

export const updateFollower: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { profileId } = req.params;
    const { id: userId } = req.user;
    let followerStatus: FollowerStatus;

    if (!isValidObjectId(profileId)) {
      return next(new AppError("Invalid profile id!", 422));
    }

    const profile = await User.findById(profileId);

    if (!profile) {
      return next(new AppError("Profile not found!", 422));
    }

    const alreadyAFollower = await User.findOne({
      _id: profileId,
      followers: userId,
    });

    if (alreadyAFollower) {
      await User.updateOne(
        {
          _id: profileId,
        },
        {
          $pull: {
            followers: userId,
          },
        }
      );
      followerStatus = "removed";
    } else {
      await User.updateOne(
        {
          _id: profileId,
        },
        {
          $addToSet: {
            followers: userId,
          },
        }
      );
      followerStatus = "added";
    }
    if (followerStatus === "added") {
      await User.updateOne(
        {
          _id: userId,
        },
        {
          $addToSet: {
            followings: profileId,
          },
        }
      );
    }
    if (followerStatus === "removed") {
      await User.updateOne(
        {
          _id: userId,
        },
        {
          $pull: {
            followings: profileId,
          },
        }
      );
    }
    res.status(200).json({
      status: "success",
      followerStatus,
    });
  }
);

export const getUploads: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, name } = req.user;
    const { limit = "20", pageNumber = "0" } = req.query as PaginationQuery;

    const data = await Audio.find({
      owner: userId,
    })
      .skip(parseInt(limit) * parseInt(pageNumber))
      .limit(parseInt(limit))
      .sort("-createdAt");

    const audios = data.map((audio) => {
      return {
        id: audio._id,
        title: audio.title,
        about: audio.about,
        file: audio.file.url,
        poster: audio.poster?.url,
        date: audio.createdAt,
        owner: {
          name,
          id: userId,
        },
      };
    });
    res.status(200).json({
      status: "success",
      audios,
    });
  }
);

export const getPublicUploads: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { limit = "20", pageNumber = "0" } = req.query as PaginationQuery;
    const { profileId } = req.params;

    if (!isValidObjectId(profileId)) {
      return next(new AppError("Invalid profile id!", 422));
    }

    const data = await Audio.find({
      owner: profileId,
    })
      .skip(parseInt(limit) * parseInt(pageNumber))
      .limit(parseInt(limit))
      .sort("-createdAt")
      .populate<AudioDocument<{ name: string; _id: ObjectId }>>("owner");

    const audios = data.map((audio) => {
      return {
        id: audio._id,
        title: audio.title,
        about: audio.about,
        file: audio.file.url,
        poster: audio.poster?.url,
        date: audio.createdAt,
        owner: {
          name: audio.owner.name,
          id: audio.owner._id,
        },
      };
    });
    res.status(200).json({
      status: "success",
      audios,
    });
  }
);

export const getPublicProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { profileId } = req.params;

    if (!isValidObjectId(profileId)) {
      return next(new AppError("Invalid profile id!", 422));
    }

    const user = await User.findById(profileId);

    if (!user) {
      return next(new AppError("Invalid profile id!", 422));
    }

    res.status(200).json({
      status: "success",
      id: user._id,
      name: user.name,
      followers: user.followers.length,
      avatar: user.avatar?.url,
    });
  }
);

export const getPublicPlaylist: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { limit = "20", pageNumber = "0" } = req.query as PaginationQuery;
    const { profileId } = req.params;

    if (!isValidObjectId(profileId)) {
      return next(new AppError("Invalid profile id!", 422));
    }

    const playlist = await Playlist.find({
      owner: profileId,
      visibility: "public",
    })
      .skip(parseInt(limit) * parseInt(pageNumber))
      .limit(parseInt(limit))
      .sort("-createdAt");

    if (!playlist) {
      return res.status(200).json({ status: "success", playlist: [] });
    }

    const formatedPlaylist = playlist.map((item) => {
      return {
        id: item._id,
        title: item.title,
        visibility: item.visibility,
      };
    });

    res.status(200).json({
      status: "success",
      playlist: formatedPlaylist,
    });
  }
);

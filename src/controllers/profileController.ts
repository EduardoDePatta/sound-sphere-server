import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { ObjectId, PipelineStage, isValidObjectId } from "mongoose";
import AppError from "../utils/appError";
import { User } from "../models";
import { PaginationQuery } from "../@types/misc";
import Audio, { AudioDocument } from "../models/audio";
import Playlist from "../models/playlist";
import History from "../models/history";
import { getUsersPreviousHistory } from "../utils/helper";
import AutoGeneratedPlaylist from "../models/autoGeneratedPlaylist";

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

export const getRecommendedByProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    let matchOptions: PipelineStage.Match = {
      $match: {
        _id: {
          $exists: true,
        },
      },
    };

    if (user) {
      const category = await getUsersPreviousHistory(req);

      if (category.length) {
        matchOptions = {
          $match: {
            category: {
              $in: category,
            },
          },
        };
      }
    }

    const audios = await Audio.aggregate([
      matchOptions,
      {
        $sort: {
          "likes.count": -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: "$title",
          category: "$category",
          about: "$about",
          file: "$file.url",
          poster: "$poster.url",
          owner: { name: "$owner.name", id: "$owner._id" },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      audios,
    });
  }
);

export const getAutoGeneratedPlaylist: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;

    const [result] = await History.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $unwind: "$all",
      },
      {
        $group: {
          _id: "$all.audio",
          items: {
            $addToSet: "$all.audio",
          },
        },
      },
      {
        $sample: {
          size: 20,
        },
      },
      {
        $group: {
          _id: null,
          items: {
            $push: "$_id",
          },
        },
      },
    ]);

    const title = "Mix 20";

    if (result) {
      await Playlist.updateOne(
        {
          owner: userId,
          title,
        },
        {
          $set: {
            title,
            items: result.items,
            visibility: "auto",
          },
        },
        {
          upsert: true,
        }
      );
    }

    const category = await getUsersPreviousHistory(req);

    let matchOptions: PipelineStage.Match = {
      $match: {
        _id: {
          $exists: true,
        },
      },
    };

    if (category.length) {
      matchOptions = {
        $match: {
          title: {
            $in: category,
          },
        },
      };
    }

    const autoGeneratedPlaylist = await AutoGeneratedPlaylist.aggregate([
      matchOptions,
      {
        $sample: {
          size: 4,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          title: "$title",
          itemsCount: {
            $size: "$items",
          },
        },
      },
    ]);

    const playlist = await Playlist.findOne({
      owner: userId,
      title,
    });

    const finalList = autoGeneratedPlaylist.concat({
      id: playlist?.id,
      title: playlist?.title,
      itemsCount: playlist?.items.length,
    });

    res.status(200).json({
      status: "success",
      playlist: finalList,
    });
  }
);

export const getFollowersProfile: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;
    const { limit = "20", pageNumber = "0" } = req.query as PaginationQuery;

    const [result] = await User.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $project: {
          followers: {
            $slice: [
              "$followers",
              parseInt(pageNumber) * parseInt(limit),
              parseInt(limit),
            ],
          },
        },
      },
      {
        $unwind: "$followers",
      },
      {
        $lookup: {
          from: "users",
          localField: "followers",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $group: {
          _id: null,
          followers: {
            $push: {
              id: "$userInfo._id",
              name: "$userInfo.name",
              avatar: "$userInfo.avatar.url",
            },
          },
        },
      },
    ]);

    if (!result) {
      return res.status(200).json({
        status: "success",
        followers: [],
      });
    }

    res.status(200).json({
      status: "success",
      followers: result.followers,
    });
  }
);

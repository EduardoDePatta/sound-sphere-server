import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { isValidObjectId } from "mongoose";
import AppError from "../utils/appError";
import Audio from "../models/audio";
import Favorite from "../models/favorite";
import { PaginationQuery } from "../@types/misc";

export type FavoriteStatus = "added" | "removed";

export const toggleFavorite: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const audioId = req.query.audioId as string;
    const { id: userId } = req.user;

    let favoriteStatus: FavoriteStatus;

    if (!isValidObjectId(audioId)) {
      return next(new AppError("Audio id is invalid!", 422));
    }

    const audio = await Audio.findById(audioId);

    if (!audio) {
      return next(new AppError("Resources not found!", 404));
    }

    const alreadyExists = await Favorite.findOne({
      owner: userId,
      items: audioId,
    });

    if (alreadyExists) {
      await Favorite.updateOne(
        { owner: userId },
        {
          $pull: { items: audioId },
        }
      );
      favoriteStatus = "removed";
    } else {
      const favorite = await Favorite.findOne({
        owner: userId,
      });
      if (favorite) {
        await Favorite.updateOne(
          {
            owner: userId,
          },
          {
            $addToSet: { items: audioId },
          }
        );
      } else {
        await Favorite.create({
          owner: userId,
          items: [audioId],
        });
      }

      favoriteStatus = "added";
    }

    if (favoriteStatus === "added") {
      await Audio.findByIdAndUpdate(audioId, {
        $addToSet: { likes: userId },
      });
    }
    if (favoriteStatus === "removed") {
      await Audio.findByIdAndUpdate(audioId, {
        $pull: { likes: userId },
      });
    }

    res.status(201).json({
      status: "success",
      favoriteStatus,
    });
  }
);

export const getFavorites: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;
    const { limit = "20", pageNumber = "0" } = req.query as PaginationQuery;

    const favorites = await Favorite.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $project: {
          audiosIds: {
            $slice: [
              "$items",
              parseInt(limit) * parseInt(pageNumber),
              parseInt(limit),
            ],
          },
        },
      },
      {
        $unwind: "$audioIds",
      },
      {
        $lookup: {
          from: "audios",
          localField: "audioIds",
          foreignField: "_id",
          as: "audioInfo",
        },
      },
      {
        $unwind: "$audioInfo",
      },
      {
        $lookup: {
          from: "users",
          localField: "audioIds.owner",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      {
        $unwind: "$ownerInfo",
      },
      {
        $project: {
          _id: 0,
          id: "$audioInfo._id",
          title: "$audioInfo.title",
          about: "$audioInfo.about",
          category: "$audioInfo.category",
          file: "$audioInfo.file.url",
          poster: "$audioInfo.poster.url",
          owner: {
            name: "$ownerInfo.name",
            id: "$ownerInfo._id",
          },
        },
      },
    ]);

    res.status(201).json({
      status: "success",
      audios: favorites,
    });
  }
);

export const getIsFavorite: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const audioId = req.query.audioId as string;
    const { id: userId } = req.user;

    if (!isValidObjectId(audioId)) {
      return next(new AppError("Invalid audio id!", 422));
    }

    const favorite = await Favorite.findOne({
      owner: userId,
      items: audioId,
    });

    res.status(201).json({
      status: "success",
      result: favorite ? true : false,
    });
  }
);

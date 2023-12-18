import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { ObjectId, isValidObjectId } from "mongoose";
import AppError from "../utils/appError";
import Audio, { AudioDocument } from "../models/audio";
import Favorite from "../models/favorite";
import { PopulatedFavoriteList } from "../@types/audio";

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

    const favorite = await Favorite.findOne({ owner: userId }).populate<{
      items: PopulatedFavoriteList[];
    }>({
      path: "items",
      populate: {
        path: "owner",
      },
    });

    if (!favorite) return res.status(200).json({ audios: [] });

    const audios = favorite.items.map((item) => {
      return {
        id: item._id,
        title: item.title,
        category: item.category,
        file: item.file.url,
        poster: item.poster?.url,
        owner: {
          name: item.owner.name,
          id: item.owner._id,
        },
      };
    });

    res.status(201).json({
      status: "success",
      audios,
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

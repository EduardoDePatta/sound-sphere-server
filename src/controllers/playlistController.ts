import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  CreatePlaylistRequest,
  PopulatedFavoriteList,
  UpdatePlaylistRequest,
} from "../@types/audio";
import Audio from "../models/audio";
import AppError from "../utils/appError";
import Playlist from "../models/playlist";
import { isValidObjectId } from "mongoose";

export const createPlaylist: RequestHandler = catchAsync(
  async (req: CreatePlaylistRequest, res: Response, next: NextFunction) => {
    const { title, resId, visibility } = req.body;
    const { id: ownerId } = req.user;

    if (resId) {
      const audio = await Audio.findById(resId);
      if (!audio) {
        next(new AppError("Could not found the audio!", 404));
      }
    }
    const newPlaylist = new Playlist({
      title,
      owner: ownerId,
      visibility,
    });

    if (resId) newPlaylist.items = [resId as any];
    await newPlaylist.save();

    res.status(201).json({
      status: "success",
      playlist: {
        id: newPlaylist._id,
        title: newPlaylist.title,
        visibility: newPlaylist.visibility,
      },
    });
  }
);

export const updatePlaylist: RequestHandler = catchAsync(
  async (req: UpdatePlaylistRequest, res: Response, next: NextFunction) => {
    const { title, item, id, visibility } = req.body;
    const { id: ownerId } = req.user;

    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: id,
        owner: ownerId,
      },
      {
        title,
        visibility,
      },
      {
        new: true,
      }
    );

    if (!playlist) {
      return next(new AppError("Playlist not found!", 404));
    }

    if (item) {
      const audio = await Audio.findById(item);
      if (!audio) {
        return next(new AppError("Audio not found!", 404));
      }
      await Playlist.findByIdAndUpdate(playlist._id, {
        $addToSet: {
          items: item,
        },
      });
    }

    res.status(200).json({
      status: "success",
      playlist: {
        id: playlist._id,
        title: playlist.title,
        visibility: playlist.visibility,
      },
    });
  }
);

export const removePlaylist: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { playlistId, resId, all } = req.query;
    const { id: userId } = req.user;

    if (!isValidObjectId(playlistId)) {
      return next(new AppError("Invalid playlist id!", 422));
    }

    if (all === "yes") {
      const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: userId,
      });
      if (!playlist) {
        return next(new AppError("Playlist not found!", 404));
      }
    }

    if (resId) {
      if (!isValidObjectId(resId)) {
        return next(new AppError("Invalid audio id!", 422));
      }
      const playlist = await Playlist.findOneAndUpdate(
        {
          _id: playlistId,
          owner: userId,
        },
        {
          $pull: {
            items: resId,
          },
        }
      );

      if (!playlist) {
        return next(new AppError("Playlist not found!", 404));
      }
    }

    res.status(200).json({
      status: "success",
      data: null,
    });
  }
);

export const getPlaylistByProfile: RequestHandler = catchAsync(
  async (req: UpdatePlaylistRequest, res: Response, next: NextFunction) => {
    const { pageNumber = "0", limit = "20" } = req.query as {
      pageNumber: string;
      limit: string;
    };
    const { id: userId } = req.user;

    const data = await Playlist.find({
      owner: userId,
      visibility: {
        $ne: "auto",
      },
    })
      .skip(parseInt(pageNumber) * parseInt(limit))
      .limit(parseInt(limit))
      .sort("-createdAt");

    const playlist = data.map((item) => {
      return {
        id: item._id,
        title: item.title,
        itemsCound: item.items.length,
        visibility: item.visibility,
      };
    });

    res.status(200).json({
      status: "success",
      playlist,
    });
  }
);

export const getAudios: RequestHandler = catchAsync(
  async (req: UpdatePlaylistRequest, res: Response, next: NextFunction) => {
    const { playlistId } = req.params;
    const { id: userId } = req.user;

    if (!isValidObjectId(playlistId)) {
      return next(new AppError("Invalid playlist id!", 422));
    }

    const playlist = await Playlist.findOne({
      owner: userId,
    }).populate<{ items: PopulatedFavoriteList[] }>({
      path: "items",
      populate: {
        path: "owner",
        select: "name",
      },
    });

    if (!playlist) {
      return res.status(200).json({ list: [] });
    }

    const audios = playlist.items.map((audio) => {
      return {
        id: audio._id,
        title: audio.title,
        category: audio.category,
        file: audio.file.url,
        poster: audio.poster?.url,
        owner: {
          name: audio.owner.name,
          id: audio.owner._id,
        },
      };
    });

    res.status(200).json({
      status: "success",
      list: {
        id: playlist._id,
        title: playlist.title,
        audios,
      },
    });
  }
);

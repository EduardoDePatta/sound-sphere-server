import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { CreateAudioRequest } from "../@types/user";
import formidable from "formidable";
import AppError from "../utils/appError";
import cloudinary from "../cloud";
import Audio from "../models/audio";
import { PopulatedFavoriteList } from "../@types/audio";
import { formatAudio } from "../utils/helper";

export const createAudio: RequestHandler = catchAsync(
  async (req: CreateAudioRequest, res: Response, next: NextFunction) => {
    const { title, about, category } = req.body;
    const poster = req.files?.poster as formidable.File;
    const audioFile = req.files?.file as formidable.File;
    const ownerId = req.user.id;

    if (!audioFile) {
      return next(new AppError("Audio file is missing!", 422));
    }

    const audioResponse = await cloudinary.uploader.upload(audioFile.filepath, {
      resource_type: "video",
    });

    const newAudio = new Audio({
      title,
      about,
      category,
      owner: ownerId,
      file: {
        url: audioResponse.url,
        publicId: audioResponse.public_id,
      },
    });

    if (poster) {
      const posterResponse = await cloudinary.uploader.upload(poster.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

      newAudio.poster = {
        url: posterResponse.url,
        publicId: posterResponse.public_id,
      };
    }

    await newAudio.save();

    res.status(201).json({
      status: "success",
      audio: {
        title,
        about,
        category,
        file: newAudio.file.url,
        poster: newAudio.poster?.url,
      },
    });
  }
);

export const updateAudio: RequestHandler = catchAsync(
  async (req: CreateAudioRequest, res: Response, next: NextFunction) => {
    const { title, about, category } = req.body;
    const poster = req.files?.poster as formidable.File;
    const ownerId = req.user.id;
    const { audioId } = req.params;

    const audio = await Audio.findOneAndUpdate(
      {
        owner: ownerId,
        _id: audioId,
      },
      { title, about, category },
      { new: true }
    );
    if (!audio) {
      return next(new AppError("Record not found!", 404));
    }

    if (poster) {
      if (audio.poster?.publicId) {
        await cloudinary.uploader.destroy(audio.poster.publicId);
      }

      const posterResponse = await cloudinary.uploader.upload(poster.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

      audio.poster = {
        url: posterResponse.url,
        publicId: posterResponse.public_id,
      };
      await audio.save();
    }

    res.status(200).json({
      status: "success",
      audio: {
        title,
        about,
        category,
        file: audio.file.url,
        poster: audio.poster?.url,
      },
    });
  }
);

export const getLatestUploads: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const limit = 10;
    const list = await Audio.find()
      .sort("-createdAt")
      .limit(limit)
      .populate<PopulatedFavoriteList>("owner");

    const audios = list.map((item) => {
      return formatAudio(item);
    });

    res.status(200).json({
      status: "success",
      audios,
    });
  }
);

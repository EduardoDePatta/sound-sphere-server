import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import History, { HistoryType } from "../models/history";
import { PaginationQuery } from "../@types/misc";

export const updateHistory: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;
    const oldHistory = await History.findOne({
      owner: userId,
    });

    const { audio, progress, date } = req.body;

    const history: HistoryType = { audio, progress, date };

    if (!oldHistory) {
      await History.create({
        owner: userId,
        last: history,
        all: [history],
      });
      return res.status(201).json({
        status: "success",
      });
    }

    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const histories = await History.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $unwind: "$all",
      },
      {
        $match: {
          "all.date": {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $project: {
          _id: 0,
          audio: "$all.audio",
        },
      },
    ]);

    const sameDayHistory = histories.find((item) => {
      if (item.audio.toString() === audio) return item;
    });

    if (sameDayHistory) {
      await History.findOneAndUpdate(
        {
          owner: userId,
          "all.audio": audio,
        },
        {
          $set: {
            "all.$.progress": progress,
            "all.$.date": date,
          },
        }
      );
    } else {
      await History.findByIdAndUpdate(oldHistory._id, {
        $push: {
          all: {
            $each: [history],
            $position: 0,
          },
        },
        $set: {
          last: history,
        },
      });
    }

    res.status(200).json({
      status: "success",
    });
  }
);

export const removeHistory: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;
    const removeAll = req.query.all === "yes";

    if (removeAll) {
      await History.findOneAndDelete({
        owner: userId,
      });
      return res.status(200).json({
        status: "success",
        data: null,
      });
    }

    const histories = req.query.histories as string;
    const historiesIds = JSON.parse(histories) as string[];

    await History.findOneAndUpdate(
      {
        owner: userId,
      },
      {
        $pull: {
          all: { _id: historiesIds },
        },
      }
    );
    res.status(200).json({
      status: "success",
    });
  }
);

export const getHistories: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { pageNumber = "0", limit = "20" } = req.query as PaginationQuery;
    const { id: userId } = req.user;

    const histories = await History.aggregate([
      {
        $match: {
          owner: userId,
        },
      },
      {
        $project: {
          all: {
            $slice: [
              "$all",
              parseInt(limit) * parseInt(pageNumber),
              parseInt(limit),
            ],
          },
        },
      },
      {
        $unwind: "$all",
      },
      {
        $lookup: {
          from: "audios",
          localField: "all.audio",
          foreignField: "_id",
          as: "audioInfo",
        },
      },
      {
        $unwind: "$audioInfo",
      },
      {
        $project: {
          _id: 0,
          id: "$all._id",
          audioId: "$audioInfo._id",
          date: "$all.date",
          title: "$audioInfo.title",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          audios: {
            $push: "$$ROOT",
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$id",
          date: "$_id",
          audios: "$$ROOT.audios",
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      histories,
    });
  }
);

export const getRecentlyPlayed: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;

    const match = {
      $match: {
        owner: userId,
      },
    };

    const sliceMatch = {
      $project: {
        myHistory: {
          $slice: ["$all", 5],
        },
      },
    };

    const dateSort = {
      $project: {
        histories: {
          $sortArray: {
            input: "$myHistory",
            sortBy: {
              date: -1,
            },
          },
        },
      },
    };

    const audioLookup = {
      $lookup: {
        from: "audios",
        localField: "histories.audio",
        foreignField: "_id",
        as: "audioInfo",
      },
    };

    const unwindWithIndex = {
      $unwind: { path: "$histories", includeArrayIndex: "index" },
    };

    const unwindAudioInfo = {
      $unwind: "$audioInfo",
    };

    const userLookup = {
      $lookup: {
        from: "users",
        localField: "audioInfo.owner",
        foreignField: "_id",
        as: "owner",
      },
    };

    const unwindUser = {
      $unwind: "$owner",
    };

    const projectResult = {
      $project: {
        _id: 0,
        id: "$audioInfo._id",
        title: "$audioInfo.title",
        about: "$audioInfo.about",
        file: "$audioInfo.file.url",
        poster: "$audioInfo.poster.url",
        category: "$audioInfo.category",
        owner: { name: "$owner.name", id: "$owner._id" },

        date: "$histories.date",
        progress: "$histories.progress",
      },
    };

    const data = await History.aggregate([
      match,
      sliceMatch,
      dateSort,
      unwindWithIndex,
      audioLookup,
      unwindAudioInfo,
      userLookup,
      unwindUser,
      projectResult,
    ]);

    res.status(200).json({
      status: "success",
      data,
    });
  }
);

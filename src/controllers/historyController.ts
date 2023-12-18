import { NextFunction, Request, RequestHandler, Response } from "express";
import catchAsync from "../utils/catchAsync";
import History, { HistoryType } from "../models/history";

export const updateHistory: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId } = req.user;
    const oldHistory = await History.findOne({
      owner: userId,
    });

    const { audio, progress, date } = req.body;

    const history: HistoryType = { audio, progress, date };

    if (!oldHistory) {
      History.create({
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
      histories,
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

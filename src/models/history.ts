import { Model, ObjectId, Schema, model, models } from "mongoose";

export type HistoryType = {
  audio: ObjectId;
  progress: number;
  date: Date;
};

interface HistoryDocument {
  owner: ObjectId;
  last: HistoryType;
  all: HistoryType[];
}

const historySchema = new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    last: {
      audio: {
        type: Schema.Types.ObjectId,
        ref: "Audio",
      },
      progress: Number,
      data: {
        type: Date,
        require: true,
      },
    },
    all: [
      {
        audio: {
          type: Schema.Types.ObjectId,
          ref: "Audio",
        },
        progress: Number,
        data: {
          type: Date,
          require: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const History = models.History || model("History", historySchema);
export default History as Model<HistoryDocument>;

import { Model, ObjectId, Schema, model, models } from "mongoose";
import { CategoriesTypes, categories } from "../utils/audioCategory";

export interface AudioDocument<T = ObjectId> {
  _id: ObjectId;
  title: string;
  about: string;
  owner: T;
  file: {
    url: string;
    publicId: string;
  };
  poster?: {
    url: string;
    publicId: string;
  };
  likes: ObjectId[];
  category: CategoriesTypes;
  createdAt: Date;
}

const AudioSchema = new Schema<AudioDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    about: {
      type: String,
      required: true,
    },
    file: {
      type: Object,
      required: true,
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    poster: {
      type: Object,
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: String,
      enum: categories,
      default: "Others",
    },
  },
  {
    timestamps: true,
  }
);

const Audio = models.Audio || model("Audio", AudioSchema);

export default Audio as Model<AudioDocument>;

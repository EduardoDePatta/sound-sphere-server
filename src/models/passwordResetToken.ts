import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface PasswordResetTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface Methods {
  compareToken(token: string): Promise<boolean>;
}

const passwordResetTokenSchema = new Schema<
  PasswordResetTokenDocument,
  {},
  Methods
>({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now(),
  },
});

passwordResetTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    this.token = await hash(this.token, 12);
  }
  next();
});

passwordResetTokenSchema.methods.compareToken = async function (token) {
  return await compare(token, this.token);
};

const PasswordResetToken = model(
  "PasswordResetToken",
  passwordResetTokenSchema
) as Model<PasswordResetTokenDocument, {}, Methods>;
export { PasswordResetToken };

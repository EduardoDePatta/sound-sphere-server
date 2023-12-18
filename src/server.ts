import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./index";
import errors from "#/constants/errors";

dotenv.config();

const DB = process.env.DATABASE?.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD ?? ""
);
if (DB) {
  mongoose
    .connect(DB)
    .then(() => {
      console.log("DB connection successful...");
    })
    .catch((error) => {
      console.log("DB Connection failed: ", error);
      process.exit(1);
    });
}

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on(errors.UNHANDLED_REJECTION, (error: Error) => {
  console.log("error: ", error.name, error.message);
  server.close(() => {
    process.exit(1);
  });
});

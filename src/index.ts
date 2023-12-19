import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import {
  audioRouter,
  authRouter,
  favoriteRouter,
  historyRouter,
  playlistRouter,
  profileRouter,
} from "./routers";
import AppError from "./utils/appError";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(morgan("dev"));

app.use(express.static("src/public"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/audio", audioRouter);
app.use("/api/v1/favorite", favoriteRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/history", historyRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 0));
});

export default app;

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
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import measurement from "./constants/measurement";
import environment from "./constants/environment";

const app = express();

app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
if (process.env.NODE_ENV === environment.DEVELOPMENT) {
  app.use(morgan("dev"));
}

app.use(express.static("src/public"));

app.use(mongoSanitize());
app.use(helmet());

const limiter = rateLimit({
  limit: 100,
  windowMs: measurement.ONE_HOUR_IN_MS,
  message: "Too many requests from this IP. Please try again in an hour",
});
app.use("/api", limiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/audio", audioRouter);
app.use("/api/v1/favorite", favoriteRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/history", historyRouter);

app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 0));
});

export default app;

import express from "express";
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

export default app;

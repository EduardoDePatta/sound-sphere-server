import { Router } from "express";
import { isVerified, mustAuth, validate } from "../middleware";
import {
  NewPlaylistValidationSchema,
  OldPlaylistValidationSchema,
} from "../utils";
import {
  createPlaylist,
  updatePlaylist,
  removePlaylist,
  getPlaylistByProfile,
  getAudios,
} from "../controllers";

const router = Router();

router.post(
  "/create",
  mustAuth,
  isVerified,
  validate(NewPlaylistValidationSchema),
  createPlaylist
);
router.patch(
  "/",
  mustAuth,
  validate(OldPlaylistValidationSchema),
  updatePlaylist
);
router.delete("/", mustAuth, removePlaylist);
router.get("/by-profile", mustAuth, getPlaylistByProfile);
router.get("/:playlistId", mustAuth, getAudios);

export { router as playlistRouter };

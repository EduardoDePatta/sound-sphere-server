import { Router } from "express";
import { mustAuth } from "../middleware";
import {
  getUploads,
  updateFollower,
  getPublicUploads,
  getPublicProfile,
  getPublicPlaylist,
} from "../controllers";

const router = Router();

router.post("/update-follower/:profileId", mustAuth, updateFollower);
router.get("/uploads", mustAuth, getUploads);
router.get("/uploads/:profileId", getPublicUploads);
router.get("/info/:profileId", getPublicProfile);
router.get("/playlist/:profileId", getPublicPlaylist);

export { router as profileRouter };

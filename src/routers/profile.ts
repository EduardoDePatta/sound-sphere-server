import { Router } from "express";
import { isAuth, mustAuth } from "../middleware";
import {
  getUploads,
  updateFollower,
  getPublicUploads,
  getPublicProfile,
  getPublicPlaylist,
  getRecommendedByProfile,
} from "../controllers";

const router = Router();

router.post("/update-follower/:profileId", mustAuth, updateFollower);
router.get("/uploads", mustAuth, getUploads);
router.get("/uploads/:profileId", getPublicUploads);
router.get("/info/:profileId", getPublicProfile);
router.get("/playlist/:profileId", getPublicPlaylist);
router.get("/recommended", isAuth, getRecommendedByProfile);

export { router as profileRouter };

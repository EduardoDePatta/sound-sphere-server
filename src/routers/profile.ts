import { Router } from "express";
import { isAuth, mustAuth } from "../middleware";
import {
  getUploads,
  updateFollower,
  getPublicUploads,
  getPublicProfile,
  getPublicPlaylist,
  getRecommendedByProfile,
  getAutoGeneratedPlaylist,
  getFollowersProfile,
  getFollowingsProfile,
  getFollowersProfilPublic,
  getPlaylistAudios,
  getPrivatePlaylistAudios,
  getIsFollowing,
} from "../controllers";

const router = Router();

router.post("/update-follower/:profileId", mustAuth, updateFollower);
router.get("/uploads", mustAuth, getUploads);
router.get("/uploads/:profileId", getPublicUploads);
router.get("/info/:profileId", getPublicProfile);
router.get("/playlist/:profileId", getPublicPlaylist);
router.get("/recommended", isAuth, getRecommendedByProfile);
router.get("/auto-generated-playlist", mustAuth, getAutoGeneratedPlaylist);
router.get("/followers", mustAuth, getFollowersProfile);
router.get("/followers/:profileId", mustAuth, getFollowersProfilPublic);
router.get("/followings", mustAuth, getFollowingsProfile);
router.get("/playlist-audios/:playlistId", getPlaylistAudios);
router.get(
  "/private-playlist-audios/:playlistId",
  mustAuth,
  getPrivatePlaylistAudios
);
router.get("/is-following/:profileId", mustAuth, getIsFollowing);

export { router as profileRouter };

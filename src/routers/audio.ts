import { Router } from "express";
import { fileParser, isVerified, mustAuth, validate } from "../middleware";
import { AudioValidationSchema } from "../utils";
import { createAudio, updateAudio, getLatestUploads } from "../controllers";

const router = Router();

router.post(
  "/create",
  mustAuth,
  isVerified,
  fileParser,
  validate(AudioValidationSchema),
  createAudio
);
router.patch(
  "/update/:audioId",
  mustAuth,
  isVerified,
  fileParser,
  validate(AudioValidationSchema),
  updateAudio
);
router.get("/latest", mustAuth, getLatestUploads);

export { router as audioRouter };

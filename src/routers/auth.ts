import { Router } from "express";
import {
  createUser,
  verifyEmail,
  sendReVerificationToken,
  generateForgetPasswordLink,
  grantValid,
  updatePassword,
  signIn,
  sendProfile,
  updateProfile,
  logOut,
} from "../controllers";
import { validate } from "../middleware/validator";
import {
  CreateUserSchema,
  SignInValidationSchema,
  TokenAndIdValidation,
  UpdatePasswordSchema,
} from "../utils/validationSchema";
import { fileParser, isValidPasswordResetToken, mustAuth } from "../middleware";

const router = Router();

router.post("/create", validate(CreateUserSchema), createUser);
router.post("/verify-email", validate(TokenAndIdValidation), verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forget-password", generateForgetPasswordLink);
router.post(
  "/verify-password-reset-token",
  validate(TokenAndIdValidation),
  isValidPasswordResetToken,
  grantValid
);
router.post(
  "/update-password",
  validate(UpdatePasswordSchema),
  isValidPasswordResetToken,
  updatePassword
);
router.post("/sign-in", validate(SignInValidationSchema), signIn);
router.get("/is-auth", mustAuth, sendProfile);
router.post("/update-profile", mustAuth, fileParser, updateProfile);
router.post("/log-out", mustAuth, logOut);

export { router as authRouter };

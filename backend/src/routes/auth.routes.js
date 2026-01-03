import { Router } from "express";
import { registerUser, login, logOutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, resetForgotPassword, getCurrentUser, changeCurrentPassword, resendEmailVerification } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import { userRegisterValidator, userLoginValidator, userForgotPasswordValidator, userChangeCurrentPasswordValidator, userResetForgotPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);

router.route("/login").post(userLoginValidator(), validate, login);

router.route("/verify-email/:verificationToken").get(verifyEmail);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest);

router
.route("/reset-password/:resetToken")
.post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

// secure route
router.route("/logout").post(verifyJWT, logOutUser);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword);

router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification);

export default router;
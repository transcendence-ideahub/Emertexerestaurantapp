import express from "express";
const router = express.Router();

import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateProfile,
  updatePassword,
  sendRegistrationOTP,
  sendPasswordOTP,
  protect,
} from "../controllers/authController.js";

router.post("/signup", signup);
router.post("/send-registration-otp", sendRegistrationOTP);
router.post("/login", login);
router.get("/logout", logout);
router.post("/password/forgot", forgotPassword);
router.patch("/password/reset/:token", resetPassword);

// Protected routes
router.use(protect);
router.get("/me", getUserProfile);
router.patch("/me/update", updateProfile);
router.patch("/password/update", updatePassword);
router.post("/me/send-password-otp", sendPasswordOTP);

export default router;
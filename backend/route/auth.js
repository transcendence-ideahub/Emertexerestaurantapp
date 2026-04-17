import express from "express";
const router = express.Router();

import {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updatePassword,
  protect,
} from "../controllers/authController.js";

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/password/forgot", forgotPassword);
router.patch("/password/reset/:token", resetPassword);

// Protected routes
router.use(protect);
router.get("/me", getUserProfile);
router.patch("/password/update", updatePassword);

export default router;
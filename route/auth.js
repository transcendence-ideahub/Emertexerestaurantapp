const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  getUserProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  protect
} = require("../controllers/authController");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/me").get(protect, getUserProfile);
router.route("/password/update").put(protect, updatePassword);
router.route("/forgetPassword").post(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);

module.exports = router;

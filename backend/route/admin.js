import express from "express";
const router = express.Router();

import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllRestaurantsAdmin,
  toggleRestaurantStatus,
  getAllOrdersAdmin
} from "../controllers/adminController.js";

import { protect, restrictTo } from "../controllers/authController.js";

// All routes here are admin only
router.use(protect);
router.use(restrictTo("admin"));

router.route("/stats").get(getDashboardStats);

router.route("/users").get(getAllUsers);
router.route("/users/:id")
  .patch(updateUser)
  .delete(deleteUser);

router.route("/restaurants").get(getAllRestaurantsAdmin);
router.route("/restaurants/:id/status").patch(toggleRestaurantStatus);

router.route("/orders").get(getAllOrdersAdmin);

export default router;

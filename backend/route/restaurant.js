import express from "express";
const router = express.Router();

import {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  deleteRestaurant,
  getOwnerRestaurant,
  updateRestaurant,
} from "../controllers/restaurantController.js";

import { protect, restrictTo } from "../controllers/authController.js";
import { getMenusByRestaurant } from "../controllers/menuController.js";

router.route("/").get(getAllRestaurants).post(createRestaurant);

// Protected owner route — must come before /:storeId to not clash
router.get("/owner", protect, restrictTo("restaurant-owner"), getOwnerRestaurant);

router.route("/:storeId")
  .get(getRestaurant)
  .patch(protect, restrictTo("restaurant-owner"), updateRestaurant)
  .delete(deleteRestaurant);

// Nested route for menus
router.get("/:storeId/menus", getMenusByRestaurant);

export default router;
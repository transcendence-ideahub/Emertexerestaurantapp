import express from "express";
const router = express.Router();

import {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  deleteRestaurant,
  getOwnerRestaurant,
  updateRestaurant,
  searchAll,
} from "../controllers/restaurantController.js";

import { protect, restrictTo } from "../controllers/authController.js";
import { getMenusByRestaurant } from "../controllers/menuController.js";

router.route("/").get(getAllRestaurants).post(createRestaurant);

// Search suggestions
router.get("/search", searchAll);

// Protected owner route — must come before /:storeId to not clash
router.get("/owner", protect, restrictTo("restaurant-owner"), getOwnerRestaurant);

router.route("/:storeId")
  .get(getRestaurant)
  .patch(protect, restrictTo("restaurant-owner"), updateRestaurant)
  .delete(deleteRestaurant);

// Nested route for menus
router.get("/:storeId/menus", getMenusByRestaurant);

export default router;
import express from "express";
const router = express.Router();

import {
  getAllRestaurants,
  createRestaurant,
  getRestaurant,
  deleteRestaurant,
} from "../controllers/restaurantController.js";

import { getMenusByRestaurant } from "../controllers/menuController.js";

router.route("/").get(getAllRestaurants).post(createRestaurant);

router.route("/:storeId")
  .get(getRestaurant)
  .delete(deleteRestaurant);

// Nested route for menus
router.get("/:storeId/menus", getMenusByRestaurant);

export default router;
import express from "express";
const router = express.Router();

import {
  getAllFoodItems,
  createFoodItem,
  getFoodItem,
  updateFoodItem,
  deleteFoodItem,
  createFoodReview,
  getDiscoveryItems,
} from "../controllers/foodItemController.js";
import { protect } from "../controllers/authController.js";

router.route("/discovery").get(getDiscoveryItems);
router.route("/review").put(protect, createFoodReview);

router.route("/").get(getAllFoodItems).post(createFoodItem);

router.route("/:foodId")
  .get(getFoodItem)
  .patch(updateFoodItem)
  .delete(deleteFoodItem);

export default router;
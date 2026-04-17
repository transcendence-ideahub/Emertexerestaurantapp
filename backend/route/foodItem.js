import express from "express";
const router = express.Router();

import {
  getAllFoodItems,
  createFoodItem,
  getFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodItemController.js";

router.route("/").get(getAllFoodItems).post(createFoodItem);

router.route("/:foodId")
  .get(getFoodItem)
  .patch(updateFoodItem)
  .delete(deleteFoodItem);

export default router;
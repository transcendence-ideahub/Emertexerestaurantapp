import express from "express";
const router = express.Router();

import {
  addItemToCart,
  updateCartItemQuantity,
  deleteCartItem,
  getCartItem,
} from "../controllers/cartController.js";

import { protect } from "../controllers/authController.js";

router.use(protect);

router.route("/")
  .get(getCartItem)
  .post(addItemToCart)
  .patch(updateCartItemQuantity)
  .delete(deleteCartItem);

export default router;
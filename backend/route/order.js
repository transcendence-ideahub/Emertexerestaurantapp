import express from "express";
const router = express.Router();

import {
  createOrder,
  getMyOrders,
  getOrderDetails,
  getOwnerOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { protect, restrictTo } from "../controllers/authController.js";

router.use(protect);

// Customer routes
router.post("/new", createOrder);
router.get("/me", getMyOrders);
router.get("/:id", getOrderDetails);

// Restaurant Owner routes
router.get("/owner/restaurant-orders", restrictTo("restaurant-owner"), getOwnerOrders);
router.patch("/:id/status", restrictTo("restaurant-owner"), updateOrderStatus);

export default router;

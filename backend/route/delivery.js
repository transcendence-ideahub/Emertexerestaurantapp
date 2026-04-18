import express from "express";
import {
  getDeliveryProfile,
  toggleAvailability,
  updateLocation,
  confirmDelivery,
} from "../controllers/deliveryController.js";
import { protect, restrictTo } from "../controllers/authController.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("delivery"));

router.get("/profile", getDeliveryProfile);
router.put("/toggle-availability", toggleAvailability);
router.put("/update-location", updateLocation);
router.post("/confirm-delivery", confirmDelivery);

export default router;

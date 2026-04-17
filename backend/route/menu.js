import express from "express";
const router = express.Router();

import { getMenusByRestaurant } from "../controllers/menuController.js";

router.get("/:storeId", getMenusByRestaurant);

export default router;
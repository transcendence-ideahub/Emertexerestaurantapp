const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const errorMiddleware = require("./middlewares/errors");

// Load Environment Variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Import all routes
const restaurantRoutes = require("./route/restaurant");
const foodItemRoutes = require("./route/foodItem");
const cartRoutes = require("./route/cart");
const authRoutes = require("./route/auth"); 

app.use("/api/v1/eats/stores", restaurantRoutes);
app.use("/api/v1/eats/item", foodItemRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/users", authRoutes); 

// Middleware to handle errors
app.use(errorMiddleware);

module.exports = app;

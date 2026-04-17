import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import Middlewares
import errorMiddleware from "./middlewares/errors.js";

// Import Routes
import restaurantRoutes from "./route/restaurant.js";
import foodItemRoutes from "./route/foodItem.js";
import cartRoutes from "./route/cart.js";
import authRoutes from "./route/auth.js";

// Initialize Environment Variables
dotenv.config();

const app = express();

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.stack}`);
  console.log("Shutting down due to uncaught exception");
  process.exit(1);
});

// Standard Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// --- ANTI-SLEEP PING LOGIC ---
// Endpoint for self-pinging
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Self-ping interval (every 14 minutes to prevent Render sleep)
const PING_INTERVAL = 14 * 60 * 1000; 
setInterval(async () => {
  try {
    const response = await fetch(`${process.env.RENDER_EXTERNAL_URL}/ping`);
    if (response.ok) {
      console.log("Self-ping successful: Server is awake");
    }
  } catch (error) {
    console.error("Self-ping failed:", error.message);
  }
}, PING_INTERVAL);

// API Routes
app.use("/api/v1/eats/stores", restaurantRoutes);
app.use("/api/v1/eats/item", foodItemRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/users", authRoutes);

// Error Middleware
app.use(errorMiddleware);

// Database Connection & Server Start
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected with HOST: ${mongoose.connection.host}`);

    const server = app.listen(process.env.PORT, () => {
      console.log(`Server started on PORT: ${process.env.PORT}`);
    });

    // Handle Unhandled Promise Rejections
    process.on("unhandledRejection", (err) => {
      console.log(`ERROR: ${err.message}`);
      console.log("Shutting down the server due to Unhandled Promise rejection");
      server.close(() => {
        process.exit(1);
      });
    });
    
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

startServer();
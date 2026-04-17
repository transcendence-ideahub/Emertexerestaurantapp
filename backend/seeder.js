import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

import Restaurant from "./models/restaurant.js";
import Menu from "./models/menu.js";
import FoodItem from "./models/foodItem.js";

dotenv.config();

// A helper function to safely remove MongoDB Extended JSON wrappers like {"$oid": "..."}
const cleanMongoJSON = (filePath) => {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  // This cleverly replaces {"$oid": "123"} with just "123" and handles {"$date": "..."}
  const cleanedData = rawData
    .replace(/\{\s*"\$oid"\s*:\s*"([a-f0-9]{24})"\s*\}/g, '"$1"')
    .replace(/\{\s*"\$date"\s*:\s*"([^"]+)"\s*\}/g, '"$1"');
  
  return JSON.parse(cleanedData);
};

// Load and clean the data
const restaurants = cleanMongoJSON('./Database/Internship.restaurants.json');
const menus = cleanMongoJSON('./Database/Internship.menus.json');
const foodItems = cleanMongoJSON('./Database/Internship.fooditems.json');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database for seeding...");

    await Restaurant.deleteMany();
    await Menu.deleteMany();
    await FoodItem.deleteMany();
    console.log("Old data completely cleared.");

    // Insert the cleaned data
    await Restaurant.insertMany(restaurants);
    await Menu.insertMany(menus);
    await FoodItem.insertMany(foodItems);
    console.log("All dummy data successfully inserted!");

    process.exit();
  } catch (error) {
    console.error("Error with seeding data:", error.message);
    process.exit(1);
  }
};

seedDatabase();
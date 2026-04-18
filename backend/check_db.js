
import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "./models/restaurant.js";

dotenv.config();

const checkRestaurants = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const restaurants = await Restaurant.find({});
    console.log(`Total restaurants: ${restaurants.length}`);
    restaurants.forEach(r => {
      console.log(`- ${r.name}: deliveryTime=${r.deliveryTime}, location=${JSON.stringify(r.location)}, owner=${r.owner}`);
    });
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkRestaurants();

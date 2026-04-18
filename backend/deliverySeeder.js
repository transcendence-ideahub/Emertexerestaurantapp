import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const seedDeliveryProfile = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const deliveryUser = {
      name: "Swiggy Delivery Partner",
      email: "delivery@ordereat.com",
      password: "password123",
      passwordConfirm: "password123",
      phoneNumber: "9876543211",
      role: "delivery",
      isAvailable: false,
    };

    const userExists = await User.findOne({ email: deliveryUser.email });

    if (userExists) {
      console.log("Delivery Partner already exists");
    } else {
      await User.create(deliveryUser);
      console.log("Delivery Partner Seeded successfully");
    }
    
    process.exit();
  } catch (error) {
    console.error("Error seeding delivery profile:", error.message);
    process.exit(1);
  }
};

seedDeliveryProfile();

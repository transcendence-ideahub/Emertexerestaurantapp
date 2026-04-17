import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Database...");

    const adminEmail = "admin@ordereat.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists!");
      process.exit();
    }

    const admin = new User({
      name: "Super Admin",
      email: adminEmail,
      password: "adminpassword123",
      passwordConfirm: "adminpassword123",
      phoneNumber: "9876543210",
      role: "admin",
    });

    await admin.save();
    console.log("Admin account created successfully!");
    console.log("Email: admin@ordereat.com");
    console.log("Password: adminpassword123");

    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

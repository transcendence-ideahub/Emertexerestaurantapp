import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter restaurant name"],
      trim: true,
      maxLength: [100, "Restaurant name cannot exceed 100 characters"],
    },
    isVeg: {
      type: Boolean,
      default: false,
    },
    hasNonVeg: {
      type: Boolean,
      default: false,
    },
    hasEgg: {
      type: Boolean,
      default: false,
    },
    hasVeg: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: [true, "Please enter restaurant address"],
    },
    ratings: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    reviews: [
      {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        Comment: { type: String, required: true },
      },
    ],
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    cuisines: {
      type: [String],
      default: ["North Indian", "Chinese", "Biryani"],
    },
    costForTwo: {
      type: Number,
      default: 200,
    },
    deliveryTime: {
      type: Number,
      default: 30,
    },
    discount: {
      type: String,
      default: "",
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
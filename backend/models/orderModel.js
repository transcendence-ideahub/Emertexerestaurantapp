import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    orderItems: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        food: {
          type: mongoose.Schema.ObjectId,
          ref: "FoodItem",
          required: true,
        },
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    deliveryPerson: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    deliveryOtp: {
      type: String,
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    deliveryPrice: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    paymentInfo: {
      method: {
        type: String,
        enum: ["COD", "Online"],
        default: "COD",
      },
      status: {
        type: String,
        default: "Pending",
      },
    },
    orderStatus: {
      type: String,
      required: true,
      default: "Processing",
      enum: ["Processing", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    },
    deliveredAt: Date,
    deliveryStartedAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;

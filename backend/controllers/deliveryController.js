import Order from "../models/orderModel.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

// Get current delivery profile and assigned order
export const getDeliveryProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Find an active order assigned to this delivery person
  const activeOrder = await Order.findOne({
    deliveryPerson: req.user.id,
    orderStatus: "Out for Delivery",
  })
    .populate("restaurant", "name address location")
    .populate("user", "name phoneNumber address");

  res.status(200).json({
    success: true,
    isAvailable: user.isAvailable,
    currentLocation: user.currentLocation,
    activeOrder,
  });
});

// Toggle availability
export const toggleAvailability = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Don't allow toggling offline if there's an active order
  if (user.isAvailable) {
    const activeOrder = await Order.findOne({
      deliveryPerson: req.user.id,
      orderStatus: "Out for Delivery",
    });
    if (activeOrder) {
      return next(new ErrorHandler("Cannot go offline while you have an active order.", 400));
    }
  }

  user.isAvailable = !user.isAvailable;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    isAvailable: user.isAvailable,
  });
});

// Update location
export const updateLocation = catchAsyncErrors(async (req, res, next) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return next(new ErrorHandler("Latitude and Longitude are required.", 400));
  }

  const user = await User.findById(req.user.id);
  user.currentLocation = { lat, lng };
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    currentLocation: user.currentLocation,
  });
});

// Confirm Delivery using OTP
export const confirmDelivery = catchAsyncErrors(async (req, res, next) => {
  const { otp, orderId } = req.body;

  if (!otp || !orderId) {
    return next(new ErrorHandler("OTP and Order ID are required.", 400));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorHandler("Order not found.", 404));
  }

  if (order.deliveryPerson.toString() !== req.user.id) {
    return next(new ErrorHandler("You are not assigned to this order.", 403));
  }

  if (order.orderStatus !== "Out for Delivery") {
    return next(new ErrorHandler("Order is not currently Out for Delivery.", 400));
  }

  if (order.deliveryOtp !== otp) {
    return next(new ErrorHandler("Invalid OTP.", 400));
  }

  // OTP matched! Mark as delivered
  order.orderStatus = "Delivered";
  order.deliveredAt = Date.now();
  await order.save();

  // Free up the delivery person
  const user = await User.findById(req.user.id);
  user.isAvailable = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Delivery confirmed successfully!",
  });
});

import Order from "../models/orderModel.js";
import Restaurant from "../models/restaurant.js";
import FoodItem from "../models/foodItem.js";
import User from "../models/user.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import Email from "../utils/email.js";

// Create new order — Customer
export const createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    restaurantId,
    itemsPrice,
    taxPrice,
    deliveryPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return next(new ErrorHandler("Restaurant not found", 404));

  if (restaurant.isActive === false) {
    return next(new ErrorHandler("This restaurant is currently closed and not accepting orders.", 400));
  }

  // Check stock for all items first
  for (const item of orderItems) {
    const foodItem = await FoodItem.findById(item.food);
    if (!foodItem) {
      return next(new ErrorHandler(`Item ${item.name} not found`, 404));
    }
    if (foodItem.stock < item.quantity) {
      return next(new ErrorHandler(`${item.name} is out of stock`, 400));
    }
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    restaurant: restaurantId,
    user: req.user.id,
    itemsPrice,
    taxPrice,
    deliveryPrice,
    totalPrice,
    paymentInfo,
    orderStatus: "Processing",
  });

  // Reduce stock for each item in the order
  for (const item of orderItems) {
    const foodItem = await FoodItem.findById(item.food);
    if (foodItem) {
      foodItem.stock = foodItem.stock - item.quantity;
      await foodItem.save({ validateBeforeSave: false });
    }
  }

  res.status(201).json({ success: true, order });
});

// Get logged-in customer's orders
export const getMyOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("restaurant", "name address images location")
    .populate("deliveryPerson", "name phoneNumber currentLocation avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, orders });
});

// Get single order detail
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("restaurant", "name address location")
    .populate("deliveryPerson", "name phoneNumber currentLocation avatar");

  if (!order) return next(new ErrorHandler("Order not found", 404));

  // Ensure user can only see their own order
  if (order.user._id.toString() !== req.user.id && req.user.role === "user") {
    return next(new ErrorHandler("Not authorized to view this order", 403));
  }

  res.status(200).json({ success: true, order });
});

// Get all orders for owner's restaurant
export const getOwnerOrders = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id });
  if (!restaurant)
    return next(new ErrorHandler("No restaurant found for this account", 404));

  const orders = await Order.find({ restaurant: restaurant._id })
    .populate("user", "name email phoneNumber")
    .populate("restaurant", "name address location")
    .populate("deliveryPerson", "name phoneNumber currentLocation avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, orders });
});

// Update order status — Restaurant Owner only
export const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("restaurant");
  if (!order) return next(new ErrorHandler("Order not found", 404));

  // Make sure only the owner of the restaurant can update the status
  if (order.restaurant.owner.toString() !== req.user.id) {
    return next(new ErrorHandler("You do not manage this restaurant", 403));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("Order has already been delivered", 400));
  }

  const statusFlow = {
    Processing: "Preparing",
    Preparing: "Out for Delivery",
    "Out for Delivery": "Delivered",
  };

  const newStatus = req.body.status || statusFlow[order.orderStatus];

  if (newStatus === "Out for Delivery" && order.orderStatus !== "Out for Delivery") {
    // Find an available delivery person
    const deliveryPerson = await User.findOne({ role: "delivery", isAvailable: true });
    
    if (!deliveryPerson) {
      return next(new ErrorHandler("No delivery partners available right now. Please try again later.", 400));
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    order.deliveryPerson = deliveryPerson._id;
    order.deliveryOtp = otp;
    
    // Mark delivery person as unavailable
    deliveryPerson.isAvailable = false;
    order.deliveryStartedAt = Date.now();
    await deliveryPerson.save({ validateBeforeSave: false });

    // Send email to customer
    try {
      const customer = await User.findById(order.user);
      if (customer) {
        await new Email(customer).sendOTP(otp);
      }
    } catch (error) {
      console.log("Error sending OTP email:", error);
      // We don't fail the request if email fails, because the customer can see the OTP on their dashboard
    }
  }

  order.orderStatus = newStatus;

  // If order is cancelled/declined, regain the stock for each item
  if (order.orderStatus === "Cancelled") {
    for (const item of order.orderItems) {
      const foodItem = await FoodItem.findById(item.food);
      if (foodItem) {
        foodItem.stock = foodItem.stock + item.quantity;
        await foodItem.save({ validateBeforeSave: false });
      }
    }
  }

  if (order.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.status(200).json({ success: true, order });
});

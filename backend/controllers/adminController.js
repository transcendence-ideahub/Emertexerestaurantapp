import User from "../models/user.js";
import Restaurant from "../models/restaurant.js";
import Order from "../models/orderModel.js";
import FoodItem from "../models/foodItem.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  const usersCount = await User.countDocuments({ role: "user" });
  const ownersCount = await User.countDocuments({ role: "restaurant-owner" });
  const restaurantsCount = await Restaurant.countDocuments();
  const orders = await Order.find();
  
  let totalRevenue = 0;
  orders.forEach(order => {
    if (order.orderStatus === "Delivered") {
      totalRevenue += order.totalPrice;
    }
  });

  res.status(200).json({
    success: true,
    stats: {
      usersCount,
      ownersCount,
      restaurantsCount,
      ordersCount: orders.length,
      totalRevenue
    }
  });
});

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find().sort("-createdAt");

  res.status(200).json({
    success: true,
    users
  });
});

// @desc    Update user role/details
// @route   PATCH /api/v1/admin/users/:id
// @access  Private/Admin
export const updateUser = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User not found with id: ${req.params.id}`, 404));
  }

  // Optional: Delete associated restaurants if owner
  if (user.role === "restaurant-owner") {
    await Restaurant.deleteMany({ owner: user._id });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

// @desc    Get all restaurants (Admin)
// @route   GET /api/v1/admin/restaurants
// @access  Private/Admin
export const getAllRestaurantsAdmin = catchAsyncErrors(async (req, res, next) => {
  const restaurants = await Restaurant.find().populate("owner", "name email").sort("-createdAt");

  res.status(200).json({
    success: true,
    restaurants
  });
});

// @desc    Toggle restaurant status (Verify/Deactivate)
// @route   PATCH /api/v1/admin/restaurants/:id/status
// @access  Private/Admin
export const toggleRestaurantStatus = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorHandler("Restaurant not found", 404));
  }

  restaurant.isActive = !restaurant.isActive;
  await restaurant.save();

  res.status(200).json({
    success: true,
    restaurant
  });
});

// @desc    Get all orders (Admin)
// @route   GET /api/v1/admin/orders
// @access  Private/Admin
export const getAllOrdersAdmin = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("restaurant", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    orders
  });
});

// @desc    Delete restaurant and all related data (Admin)
// @route   DELETE /api/v1/admin/restaurants/:id
// @access  Private/Admin
export const deleteRestaurantAdmin = catchAsyncErrors(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(new ErrorHandler("Restaurant not found", 404));
  }

  // 1. Delete all food items belonging to this restaurant
  await FoodItem.deleteMany({ restaurant: restaurant._id });

  // 2. Delete all orders associated with this restaurant
  await Order.deleteMany({ restaurant: restaurant._id });

  // 3. Delete the restaurant itself
  await restaurant.deleteOne();

  res.status(200).json({
    success: true,
    message: "Restaurant and all associated food items and orders have been permanently deleted."
  });
});

// @desc    Update user password (Admin)
// @route   PATCH /api/v1/admin/users/:id/password
// @access  Private/Admin
export const updateUserPasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  if (!password) return next(new ErrorHandler("Please provide a new password", 400));

  const user = await User.findById(req.params.id).select("+password");
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.password = password;
  user.passwordConfirm = password; 

  await user.save();

  res.status(200).json({
    success: true,
    message: "User password updated successfully"
  });
});

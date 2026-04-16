const Restaurant = require("../models/restaurant");
const ErrorHandler = require("../utils/errorHandler");
const catchAsync = require("../middlewares/catchAsyncErrors");

exports.getAllRestaurants = catchAsync(async (req, res, next) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  const restaurants = await Restaurant.find({ ...keyword });

  res.status(200).json({
    success: true,
    count: restaurants.length,
    restaurants,
  });
});

exports.createRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.create(req.body);

  res.status(201).json({
    success: true,
    restaurant,
  });
});

exports.getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.storeId);

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    restaurant,
  });
});

exports.deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.storeId);

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    message: "Restaurant is deleted.",
  });
});

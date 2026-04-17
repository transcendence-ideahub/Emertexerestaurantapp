import Restaurant from "../models/restaurant.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getAllRestaurants = catchAsync(async (req, res, next) => {
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

export const createRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.create(req.body);

  res.status(201).json({
    success: true,
    restaurant,
  });
});

export const getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.storeId);

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    restaurant,
  });
});

export const deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.storeId);

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    message: "Restaurant is deleted.",
  });
});
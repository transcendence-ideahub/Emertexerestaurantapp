import Fooditem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getAllFoodItems = catchAsync(async (req, res, next) => {
  let restaurantId = {};
  if (req.params.storeId) {
    restaurantId = { restaurant: req.params.storeId };
  }

  const foodItems = await Fooditem.find(restaurantId).populate("restaurant");
  res.status(200).json({
    status: "success",
    results: foodItems.length,
    data: foodItems,
  });
});

export const createFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (body.imageUrl) {
    body.images = [{ public_id: "default", url: body.imageUrl }];
    delete body.imageUrl;
  }

  const fooditem = await Fooditem.create(body);
  res.status(201).json({
    status: "success",
    data: fooditem,
  });
});

export const getFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId);

  if (!foodItem) return next(new ErrorHandler("No foodItem found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

export const updateFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndUpdate(req.params.foodId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!foodItem) return next(new ErrorHandler("No document found with that ID", 404));

  res.status(200).json({
    status: "success",
    data: foodItem,
  });
});

export const deleteFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findByIdAndDelete(req.params.foodId);

  if (!foodItem) return next(new ErrorHandler("No document found with that ID", 404));

  res.status(204).json({
    status: "success",
  });
});
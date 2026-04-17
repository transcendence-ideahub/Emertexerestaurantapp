import Menu from "../models/menu.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getMenusByRestaurant = catchAsync(async (req, res, next) => {
  const menus = await Menu.find({ restaurant: req.params.storeId }).populate("menu.items");

  res.status(200).json({
    success: true,
    data: menus,
    count: menus.length,
  });
});
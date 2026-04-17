import Menu from "../models/menu.js";
import FoodItem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getMenusByRestaurant = catchAsync(async (req, res, next) => {
  const menus = await Menu.find({ restaurant: req.params.storeId }).populate("menu.items");

  if (menus.length > 0) {
    return res.status(200).json({
      success: true,
      menus: menus[0].menu,
    });
  }

  // Fallback: If no Menu document exists, fetch all FoodItems for this restaurant
  // and group them under a default category "Main Menu"
  const foodItems = await FoodItem.find({ restaurant: req.params.storeId });
  
  const defaultMenu = foodItems.length > 0 ? [
    {
      _id: "default-cat",
      category: "Main Menu",
      items: foodItems
    }
  ] : [];

  res.status(200).json({
    success: true,
    menus: defaultMenu,
  });
});
const Menu = require("../models/menu");
const ErrorHandler = require("../utils/errorHandler");
const catchAsync = require("../middlewares/catchAsyncErrors");

exports.getMenusByRestaurant = catchAsync(async (req, res, next) => {
  const menus = await Menu.find({ restaurant: req.params.storeId }).populate(
    "menu.items"
  );

  res.status(200).json({
    success: true,
    data: menus,
    count: menus.length,
  });
});

import Fooditem from "../models/foodItem.js";
import Restaurant from "../models/restaurant.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getAllFoodItems = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.storeId) {
    filter.restaurant = req.params.storeId;
  }
  // Also support ?restaurant=<id> query param (used by partner dashboard)
  if (req.query.restaurant) {
    filter.restaurant = req.query.restaurant;
  }

  const foodItems = await Fooditem.find(filter).populate("restaurant");
  res.status(200).json({
    success: true,
    results: foodItems.length,
    foodItems,
  });
});

export const createFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (body.imageUrl) {
    body.images = [{ public_id: "default", url: body.imageUrl }];
    delete body.imageUrl;
  }

  const foodItem = await Fooditem.create(body);

  // Update restaurant flags based on dish type
  if (foodItem.dishType === "Non-Veg") {
    await Restaurant.findByIdAndUpdate(foodItem.restaurant, { hasNonVeg: true });
  } else if (foodItem.dishType === "Egg") {
    await Restaurant.findByIdAndUpdate(foodItem.restaurant, { hasEgg: true });
  }

  res.status(201).json({
    success: true,
    foodItem,
  });
});

export const getFoodItem = catchAsync(async (req, res, next) => {
  const foodItem = await Fooditem.findById(req.params.foodId).populate("restaurant");

  if (!foodItem) return next(new ErrorHandler("No foodItem found with that ID", 404));

  res.status(200).json({
    success: true,
    foodItem,
  });
});

export const updateFoodItem = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  if (body.imageUrl) {
    body.images = [{ public_id: "default", url: body.imageUrl }];
    delete body.imageUrl;
  }

  const foodItem = await Fooditem.findByIdAndUpdate(req.params.foodId, body, {
    new: true,
    runValidators: true,
  });

  if (!foodItem) return next(new ErrorHandler("No document found with that ID", 404));

  if (foodItem.dishType === "Non-Veg") {
    await Restaurant.findByIdAndUpdate(foodItem.restaurant, { hasNonVeg: true });
  } else if (foodItem.dishType === "Egg") {
    await Restaurant.findByIdAndUpdate(foodItem.restaurant, { hasEgg: true });
  }

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

// Create/Update Food Review
export const createFoodReview = catchAsync(async (req, res, next) => {
  const { rating, comment, foodId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    Comment: comment,
  };

  const foodItem = await Fooditem.findById(foodId);

  const isReviewed = foodItem.reviews.find(
    (r) => r.user?.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    foodItem.reviews.forEach((rev) => {
      if (rev.user?.toString() === req.user._id.toString()) {
        rev.Comment = comment;
        rev.rating = rating;
      }
    });
  } else {
    foodItem.reviews.push(review);
    foodItem.numOfReviews = foodItem.reviews.length;
  }

  foodItem.ratings =
    foodItem.reviews.reduce((acc, item) => item.rating + acc, 0) /
    foodItem.reviews.length;

  await foodItem.save({ validateBeforeSave: false });

  // Update Restaurant Aggregate Rating
  const restaurantId = foodItem.restaurant;
  if (restaurantId) {
    const allItems = await Fooditem.find({ restaurant: restaurantId });
    const itemsWithRatings = allItems.filter(item => item.numOfReviews > 0);

    if (itemsWithRatings.length > 0) {
      const avgRating = itemsWithRatings.reduce((acc, item) => acc + item.ratings, 0) / itemsWithRatings.length;
      const totalReviews = itemsWithRatings.reduce((acc, item) => acc + item.numOfReviews, 0);

      await Restaurant.findByIdAndUpdate(restaurantId, {
        ratings: avgRating,
        numOfReviews: totalReviews
      });
      console.log(`Updated Restaurant ${restaurantId} ratings to ${avgRating} based on ${itemsWithRatings.length} items.`);
    }
  }

  res.status(200).json({
    success: true,
  });
});

// Get Discovery Food Items (Shuffled + Filtered)
export const getDiscoveryItems = catchAsync(async (req, res, next) => {
  const { dishType, rating, cuisine, search } = req.query;
  let filter = {};

  // Map "Pure Veg" to "Veg"
  if (dishType === "Pure Veg") filter.dishType = "Veg";
  else if (dishType === "Non-Veg") filter.dishType = "Non-Veg";
  else if (dishType === "Egg") filter.dishType = "Egg";

  if (rating) filter.ratings = { $gte: Number(rating) };

  // Search keyword filter
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Fetch items with populated restaurant explicitly including isActive
  let foodItems = await Fooditem.find(filter).populate({
    path: "restaurant",
    select: "name isActive location cuisines images owner"
  });

  foodItems = foodItems.filter(item =>
    item.restaurant &&
    item.restaurant.owner
  );

  // Filter by cuisine if requested (item cuisines field only)
  if (cuisine && cuisine !== 'All') {
    foodItems = foodItems.filter(item =>
      item.cuisines && item.cuisines.includes(cuisine)
    );
  }

  // Shuffle the results
  for (let i = foodItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [foodItems[i], foodItems[j]] = [foodItems[j], foodItems[i]];
  }

  const { lat, lng } = req.query;
    foodItems = foodItems.map(item => {
      const itemObj = item.toObject();
      const res = item.restaurant;

      if (res) {
        // Ensure the restaurant object is a plain object with isActive explicitly set
        itemObj.restaurant = res.toObject ? res.toObject() : res;
        itemObj.restaurant.isActive = res.isActive !== false;

        if (lat && lng && res.location && res.location.coordinates) {
          const userLat = parseFloat(lat);
          const userLng = parseFloat(lng);
          const [resLng, resLat] = res.location.coordinates;
          const R = 6371;
          const dLat = (resLat - userLat) * (Math.PI / 180);
          const dLng = (resLng - userLng) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * (Math.PI / 180)) * Math.cos(resLat * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          itemObj.distance = distance;
          itemObj.deliveryTime = Math.round(10 + (distance * 5));
        } else {
          itemObj.deliveryTime = 35;
        }
      }
      return itemObj;
    });

  res.status(200).json({
    success: true,
    results: foodItems.length,
    foodItems: foodItems.slice(0, 40),
  });
});
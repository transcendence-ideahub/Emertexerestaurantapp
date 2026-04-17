import Restaurant from "../models/restaurant.js";
import Fooditem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getAllRestaurants = catchAsync(async (req, res, next) => {
  const { lat, lng, keyword: keywordQuery } = req.query;
  
  let restaurantIdsByFood = [];
  if (keywordQuery) {
    // Find food items matching keyword and get their restaurant IDs
    const matchingItems = await Fooditem.find({
      name: { $regex: keywordQuery, $options: "i" },
    }).select("restaurant");
    restaurantIdsByFood = matchingItems.map((item) => item.restaurant);
  }

  const keyword = keywordQuery
    ? {
        $or: [
          { name: { $regex: keywordQuery, $options: "i" } },
          { _id: { $in: restaurantIdsByFood } },
        ],
      }
    : {};

  let restaurants = await Restaurant.find({
    ...keyword,
    owner: { $exists: true, $ne: null },
  }).populate("owner", "name email");

  // Fix: Ensure restaurants have correct flags if they weren't set yet
  for (let res of restaurants) {
    if (!res.hasNonVeg || !res.hasEgg) {
      const items = await Fooditem.find({ restaurant: res._id });
      const hasNV = items.some(i => i.dishType === "Non-Veg");
      const hasE = items.some(i => i.dishType === "Egg");
      if (hasNV !== res.hasNonVeg || hasE !== res.hasEgg) {
        await Restaurant.findByIdAndUpdate(res._id, { hasNonVeg: hasNV, hasEgg: hasE });
        res.hasNonVeg = hasNV;
        res.hasEgg = hasE;
      }
    }
  }

  // Calculate distance if user location is provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    restaurants = restaurants.map(res => {
      const restaurantObj = res.toObject();
      if (res.location && res.location.coordinates) {
        const [resLng, resLat] = res.location.coordinates;
        // Haversine formula for distance in KM
        const R = 6371;
        const dLat = (resLat - userLat) * (Math.PI / 180);
        const dLng = (resLng - userLng) * (Math.PI / 180);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * (Math.PI/180)) * Math.cos(resLat * (Math.PI/180)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in KM
        
        restaurantObj.distance = distance;
        // Delivery time = 10 mins prep + 5 mins per KM
        restaurantObj.deliveryTime = Math.round(10 + (distance * 5));
      } else {
        restaurantObj.distance = 999;
        restaurantObj.deliveryTime = 45; // Fallback
      }
      return restaurantObj;
    });
  }

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

// Get the restaurant owned by the logged-in owner
export const getOwnerRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id });

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found for your account. Please register first.", 404));
  }

  res.status(200).json({
    success: true,
    restaurant,
  });
});

export const updateRestaurant = catchAsync(async (req, res, next) => {
  const body = { ...req.body };
  
  // Handle image URL conversion to images array schema
  if (body.imageUrl) {
    body.images = [{ public_id: "default", url: body.imageUrl }];
    delete body.imageUrl;
  }

  const restaurant = await Restaurant.findByIdAndUpdate(req.params.storeId, body, {
    new: true,
    runValidators: true,
  });

  if (!restaurant) {
    return next(new ErrorHandler("No restaurant found with that ID", 404));
  }

  res.status(200).json({
    success: true,
    restaurant,
  });
});
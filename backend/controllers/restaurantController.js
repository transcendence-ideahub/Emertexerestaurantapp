import Restaurant from "../models/restaurant.js";
import Fooditem from "../models/foodItem.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsync from "../middlewares/catchAsyncErrors.js";

export const getAllRestaurants = catchAsync(async (req, res, next) => {
  const { lat, lng, keyword: keywordQuery, cuisine } = req.query;
  
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
          { cuisines: { $regex: keywordQuery, $options: "i" } },
          { _id: { $in: restaurantIdsByFood } },
        ],
      }
    : {};

  let restaurantIdsByCuisine = [];
  if (cuisine && cuisine !== 'All') {
    const matchingItems = await Fooditem.find({
      cuisines: { $regex: cuisine, $options: "i" }
    }).select("restaurant");
    restaurantIdsByCuisine = matchingItems.map(item => item.restaurant);
  }

  const cuisineFilter = cuisine && cuisine !== 'All' 
    ? { _id: { $in: restaurantIdsByCuisine } } 
    : {};

  let restaurants = await Restaurant.find({
    ...keyword,
    ...cuisineFilter,
    owner: { $exists: true, $ne: null },
  }).populate("owner", "name email");

  // Fix: Ensure restaurants have correct flags if they weren't set yet
  for (let res of restaurants) {
    if (!res.hasNonVeg || !res.hasEgg || !res.hasVeg) {
      const items = await Fooditem.find({ restaurant: res._id });
      const hasNV = items.some(i => i.dishType === "Non-Veg");
      const hasE = items.some(i => i.dishType === "Egg");
      const hasV = items.some(i => i.dishType === "Veg");
      
      if (hasNV !== res.hasNonVeg || hasE !== res.hasEgg || hasV !== res.hasVeg) {
        await Restaurant.findByIdAndUpdate(res._id, { 
          hasNonVeg: hasNV, 
          hasEgg: hasE,
          hasVeg: hasV 
        });
        res.hasNonVeg = hasNV;
        res.hasEgg = hasE;
        res.hasVeg = hasV;
      }
    }
  }

  // Calculate distance if user location is provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

      restaurants = restaurants.map(res => {
        const restaurantObj = res.toObject();
        // Ensure isActive is always present
        restaurantObj.isActive = res.isActive !== false;

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
        // Fallback for restaurants without coordinates: 
        // Assign a plausible random distance (1.5km - 6km) and calculate time
        const randomDist = (Math.random() * 4.5 + 1.5); 
        restaurantObj.distance = parseFloat(randomDist.toFixed(1));
        restaurantObj.deliveryTime = Math.round(12 + (randomDist * 6)); // 12 mins prep + 6 mins/km
      }
      return restaurantObj;
    });
  } else {
    // If no coordinates provided, ensure we still show realistic varied times 
    // instead of a static value (e.g. 45) from the database
    restaurants = restaurants.map(res => {
      const restaurantObj = res.toObject();
      // Ensure isActive is always present (Open by default if undefined)
      restaurantObj.isActive = res.isActive !== false;

      if (!restaurantObj.deliveryTime || restaurantObj.deliveryTime === 45) {
        const randomTime = Math.floor(Math.random() * 20) + 25;
        restaurantObj.deliveryTime = randomTime;
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

  // Handle GeoJSON location formatting
  if (body.location && body.location.lat && body.location.lng) {
    body.location = {
      type: "Point",
      coordinates: [body.location.lng, body.location.lat]
    };
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

// Advanced Dynamic Search for Suggestions
export const searchAll = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(200).json({ success: true, results: [] });
  }

  const query = q.trim();

  // Search Restaurants (limit to 4 for suggestions)
  const restaurants = await Restaurant.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { cuisines: { $regex: query, $options: "i" } },
    ],
  }).limit(4).select("name images ratings cuisines isActive");

  // Search Food Items (limit to 6 for suggestions)
  const foodItems = await Fooditem.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { cuisines: { $regex: query, $options: "i" } },
    ],
  }).limit(6).populate("restaurant", "name").select("name images price ratings restaurant cuisines");

  // Combine and format
  const results = [
    ...restaurants.map(r => ({
      _id: r._id,
      name: r.name,
      image: r.images?.[0]?.url || "",
      rating: r.ratings,
      info: r.cuisines?.slice(0, 2).join(", ") || "",
      type: 'restaurant'
    })),
    ...foodItems.map(f => ({
      _id: f._id,
      name: f.name,
      image: f.images?.[0]?.url || "",
      rating: f.ratings,
      info: f.restaurant?.name || "Restaurant",
      restaurantId: f.restaurant?._id,
      type: 'dish'
    })),
  ];

  res.status(200).json({
    success: true,
    results,
  });
});
const app = require("./app");
const connectDatabase = require("./config/database");
const Restaurant = require("./models/restaurant");
const Fooditem = require("./models/foodItem");

process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.stack}`);
  console.log("Shutting down due to uncaught exception");
  process.exit(1);
});

if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

const foodItems = [
  {
    name: "Margherita Pizza",
    description: "Classic Italian pizza with tomato sauce, mozzarella, and fresh basil",
    price: 299,
    category: "Pizza",
    restaurant: null,
    ratings: 4.5,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400" }],
  },
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice cooked with spices and tender chicken",
    price: 350,
    category: "Rice",
    restaurant: null,
    ratings: 4.7,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" }],
  },
  {
    name: "Vegetable Fried Rice",
    description: "Stir-fried rice with fresh vegetables and soy sauce",
    price: 199,
    category: "Rice",
    restaurant: null,
    ratings: 4.3,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" }],
  },
  {
    name: "Grilled Chicken",
    description: "Tender grilled chicken with herbs and spices",
    price: 399,
    category: "Main Course",
    restaurant: null,
    ratings: 4.6,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400" }],
  },
  {
    name: "Vegetable Burger",
    description: "Delicious veg patty with fresh lettuce, tomato, and cheese",
    price: 199,
    category: "Burger",
    restaurant: null,
    ratings: 4.2,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" }],
  },
  {
    name: "Masala Dosa",
    description: "Crispy rice pancake served with sambar and chutney",
    price: 150,
    category: "South Indian",
    restaurant: null,
    ratings: 4.4,
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400" }],
  },
];

const restaurants = [
  {
    name: "Pizza Palace",
    isVeg: false,
    address: "123 Main Street, City Center",
    ratings: 4.5,
    numOfReviews: 120,
    reviews: [],
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400" }],
  },
  {
    name: "Spice Garden",
    isVeg: true,
    address: "456 Garden Road, Green Park",
    ratings: 4.3,
    numOfReviews: 85,
    reviews: [],
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400" }],
  },
  {
    name: "Burger Barn",
    isVeg: false,
    address: "789 Fast Food Lane, Downtown",
    ratings: 4.1,
    numOfReviews: 200,
    reviews: [],
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400" }],
  },
  {
    name: "Biryani House",
    isVeg: false,
    address: "321 Rice Bowl Street, North Zone",
    ratings: 4.7,
    numOfReviews: 150,
    reviews: [],
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1565932884899-5d03c9c2d7e9?w=400" }],
  },
  {
    name: "South Indian Delight",
    isVeg: true,
    address: "654 Dosa Road, East End",
    ratings: 4.4,
    numOfReviews: 90,
    reviews: [],
    images: [{ public_id: "sample_id", url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" }],
  },
];

const seedDatabase = async () => {
  const count = await Restaurant.countDocuments();
  if (count > 0) {
    console.log("Database already seeded");
    return;
  }

  const createdRestaurants = await Restaurant.insertMany(restaurants);
  console.log(`${createdRestaurants.length} restaurants seeded`);

  const foodItemsWithRestaurant = foodItems.map((item, index) => ({
    ...item,
    restaurant: createdRestaurants[index % createdRestaurants.length]._id,
  }));

  await Fooditem.insertMany(foodItemsWithRestaurant);
  console.log(`${foodItemsWithRestaurant.length} food items seeded`);
  console.log("Database seeded successfully!");
};

const startServer = async () => {
  await connectDatabase();
  
  await seedDatabase();

  const server = app.listen(process.env.PORT, () => {
    console.log(`Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`);
  });

  process.on("unhandledRejection", (err) => {
    console.log(`ERROR: ${err.message}`);
    console.log("Shutting down the server due to Unhandled Promise rejection");
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();

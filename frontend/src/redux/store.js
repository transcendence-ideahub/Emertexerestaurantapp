import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import restaurantReducer from "./slices/restaurantSlice";
import menuReducer from "./slices/menuSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    restaurants: restaurantReducer,
    menus: menuReducer,
    cart: cartReducer,
    order: orderReducer,
  },
});

export default store;

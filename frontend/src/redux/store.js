import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import { menuReducer } from "./reducers/menuReducer";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    menus: menuReducer,
  },
});

export default store;
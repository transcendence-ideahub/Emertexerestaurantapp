import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Future reducers for restaurants, menu, and cart will go here
  },
});

export default store;
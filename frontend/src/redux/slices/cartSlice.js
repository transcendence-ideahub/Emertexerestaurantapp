import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  restaurant: {},
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    cartRequest: (state) => {
      state.loading = true;
    },
    cartSuccess: (state, action) => {
      state.loading = false;
      state.cartItems = action.payload.cartItems;
      state.restaurant = action.payload.restaurant;
    },
    cartFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateCartSuccess: (state, action) => {
      state.cartItems = action.payload;
    },
    removeCartSuccess: (state, action) => {
      state.cartItems = action.payload;
    },
    clearCartErrors: (state) => {
      state.error = null;
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.restaurant = {};
    },
    addItemToCart: (state, action) => {
      const payload = action.payload;
      const foodItem = payload.foodItem || payload;
      const restaurant = payload.restaurant || payload.restaurant;
      const existingItem = state.cartItems.find(
        (item) => item._id === foodItem._id || item._id === foodItem
      );
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cartItems.push({ 
          _id: foodItem._id || foodItem,
          name: foodItem.name,
          price: foodItem.price,
          images: foodItem.images,
          quantity: 1 
        });
      }
      if (restaurant) {
        state.restaurant = restaurant;
      }
    },
  },
});

export const {
  cartRequest,
  cartSuccess,
  cartFail,
  updateCartSuccess,
  removeCartSuccess,
  clearCartErrors,
  addItemToCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

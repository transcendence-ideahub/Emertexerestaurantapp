import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [], // This holds the array of food items in the cart
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Action to add an item to the cart
    addItemToCart: (state, action) => {
      const item = action.payload;
      // Check if the item already exists in the cart
      const isItemExist = state.cartItems.find(
        (i) => i.foodItem === item.foodItem
      );

      if (isItemExist) {
        // If it exists, update the quantity instead of adding a new row
        state.cartItems = state.cartItems.map((i) =>
          i.foodItem === isItemExist.foodItem ? item : i
        );
      } else {
        // If it's a new item, push it to the array
        state.cartItems.push(item);
      }
    },

    // Action to remove an item from the cart
    removeItemFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (i) => i.foodItem !== action.payload
      );
    },

    // Action to clear the entire cart after a successful order
    clearCart: (state) => {
      state.cartItems = [];
    },
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;
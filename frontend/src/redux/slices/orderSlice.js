import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    orderRequest: (state) => {
      state.loading = true;
    },
    orderSuccess: (state, action) => {
      state.loading = false;
      state.order = action.payload;
    },
    myOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    orderFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearErrors: (state) => {
      state.error = null;
    },
  },
});

export const {
  orderRequest,
  orderSuccess,
  myOrdersSuccess,
  orderFail,
  clearErrors,
} = orderSlice.actions;

export default orderSlice.reducer;

import API from "../../utils/api";
import {
  cartRequest,
  cartSuccess,
  cartFail,
  updateCartSuccess,
  removeCartSuccess,
  addItemToCart as addItemToCartAction,
} from "../slices/cartSlice";

export const addItemToCart = (foodItem, restaurant) => ({
  type: "cart/addItemToCart",
  payload: { foodItem, restaurant },
});

export const fetchCartItems = () => async (dispatch) => {
  try {
    dispatch(cartRequest());
    const { data } = await API.get("/v1/eats/cart");
    dispatch(cartSuccess(data.data));
  } catch (error) {
    dispatch(cartFail(error.response?.data?.message || "Failed to fetch cart"));
  }
};

export const removeItemFromCart = (id) => async (dispatch) => {
  try {
    const { data } = await API.delete(`/v1/eats/cart/${id}`);
    dispatch(removeCartSuccess(data.data.cartItems));
  } catch (error) {
    dispatch(cartFail(error.response?.data?.message || "Failed to remove item"));
  }
};

export const updateCartQuantity = (id, quantity) => async (dispatch) => {
  try {
    const { data } = await API.put(`/v1/eats/cart/${id}`, { quantity });
    dispatch(updateCartSuccess(data.data.cartItems));
  } catch (error) {
    dispatch(cartFail(error.response?.data?.message || "Failed to update quantity"));
  }
};

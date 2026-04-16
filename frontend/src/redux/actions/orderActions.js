import API from "../../utils/api";
import {
  orderRequest,
  orderSuccess,
  myOrdersSuccess,
  orderFail,
} from "../slices/orderSlice";

export const getOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch(orderRequest());
    const { data } = await API.get(`/v1/eats/orders/${id}`);
    dispatch(orderSuccess(data.data));
  } catch (error) {
    dispatch(orderFail(error.response?.data?.message || "Failed to fetch order details"));
  }
};

export const myOrders = () => async (dispatch) => {
  try {
    dispatch(orderRequest());
    const { data } = await API.get("/v1/eats/orders/me/myOrders");
    dispatch(myOrdersSuccess(data.data));
  } catch (error) {
    dispatch(orderFail(error.response?.data?.message || "Failed to fetch orders"));
  }
};

// Create Order Action
export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch(orderRequest());
    const { data } = await API.post("/v1/eats/orders/new", orderData);
    dispatch(orderSuccess(data.data));
  } catch (error) {
    dispatch(orderFail(error.response?.data?.message || "Failed to create order"));
  }
};

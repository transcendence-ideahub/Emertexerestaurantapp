import { cartActions } from "../redux/slices/cartSlice";

// Action to Add or Update items in the cart
export const addItemToCart = (item, quantity) => (dispatch) => {
  // We format the object to match what your Redux state expects
  const cartItem = {
    foodItem: item.foodItem || item._id, // Handles both raw item and already mapped item
    name: item.name,
    price: item.price,
    image: item.image || (item.images && item.images[0]?.url),
    stock: item.stock,
    quantity
  };

  // Dispatch to the slice reducer
  dispatch(cartActions.addItemToCart(cartItem));
};

// Action to Remove a specific item from the cart
export const removeItemFromCart = (id) => (dispatch) => {
  dispatch(cartActions.removeItemFromCart(id));
};

// Action to clear the cart (useful after successful order)
export const clearCart = () => (dispatch) => {
  dispatch(cartActions.clearCart());
};
import { BASE_URL } from "../utils/api";
import { cartActions } from "../redux/slices/cartSlice";

// Action to Add or Update items in the cart
export const addItemToCart = (id, quantity) => async (dispatch) => {
  try {
    // This fetches the specific food item details from the backend
    const response = await fetch(`${BASE_URL}/eats/item/${id}`);
    const data = await response.json();

    if (data.success) {
      const item = data.foodItem;
      const cartItem = {
        foodItem: item._id,
        name: item.name,
        price: item.price,
        image: item.images?.[0]?.url || "https://via.placeholder.com/150",
        stock: item.stock,
        restaurant: item.restaurant?._id,
        restaurantData: {
          discountPercentage: item.restaurant?.discountPercentage || 0,
          maxDiscount: item.restaurant?.maxDiscount || 0,
          minOrderValue: item.restaurant?.minOrderValue || 0,
        },
        quantity
      };

      // Dispatch to the slice reducer
      dispatch(cartActions.addItemToCart(cartItem));
    }
  } catch (error) {
    console.error("Failed to add item to cart", error);
  }
};

// Action to Remove a specific item from the cart
export const removeItemFromCart = (id) => (dispatch) => {
  dispatch(cartActions.removeItemFromCart(id));
};

// Action to clear the cart (useful after successful order)
export const clearCart = () => (dispatch) => {
  dispatch(cartActions.clearCart());
};
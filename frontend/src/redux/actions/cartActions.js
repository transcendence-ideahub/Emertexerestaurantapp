import { cartActions } from "../slices/cartSlice";

export const addItemToCart = (id, quantity) => async (dispatch) => {
  try {
    // This fetches the specific food item details to add to the cart
    const response = await fetch(`/api/v1/eats/item/${id}`);
    const data = await response.json();

    dispatch(
      cartActions.addItemToCart({
        product: data.foodItem._id,
        name: data.foodItem.name,
        price: data.foodItem.price,
        image: data.foodItem.images[0].url,
        stock: data.foodItem.stock,
        quantity,
      })
    );
  } catch (error) {
    console.error("Failed to add item to cart", error);
  }
};
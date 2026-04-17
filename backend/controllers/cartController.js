import Cart from "../models/cartModel.js";
import FoodItem from "../models/foodItem.js";
import Restaurant from "../models/restaurant.js";

export const addItemToCart = async (req, res) => {
  const { userId, foodItemId, restaurantId, quantity } = req.body;

  try {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) return res.status(404).json({ message: "Food item not found" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      if (cart.restaurant.toString() !== restaurantId) {
        await Cart.deleteOne({ _id: cart._id });
        cart = new Cart({
          user: userId,
          restaurant: restaurantId,
          items: [{ foodItem: foodItemId, quantity }],
        });
      } else {
        const itemIndex = cart.items.findIndex((item) => item.foodItem.toString() === foodItemId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += quantity;
        } else {
          cart.items.push({ foodItem: foodItemId, quantity });
        }
      }
    } else {
      cart = new Cart({
        user: userId,
        restaurant: restaurantId,
        items: [{ foodItem: foodItemId, quantity }],
      });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: userId })
      .populate({ path: "items.foodItem", select: "name price images" })
      .populate({ path: "restaurant", select: "name" });

    res.status(200).json({ message: "Cart updated", cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  const { userId, foodItemId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => item.foodItem.toString() === foodItemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Food item not found in cart" });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findOne({ user: userId })
      .populate({ path: "items.foodItem", select: "name price images" })
      .populate({ path: "restaurant", select: "name" });

    res.status(200).json({ message: "Cart item quantity updated", cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteCartItem = async (req, res) => {
  const { userId, foodItemId } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => item.foodItem.toString() === foodItemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Food item not found in cart" });

    cart.items.splice(itemIndex, 1);

    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.status(200).json({ message: "Cart deleted" });
    } else {
      await cart.save();
      const updatedCart = await Cart.findOne({ user: userId })
        .populate({ path: "items.foodItem", select: "name price images" })
        .populate({ path: "restaurant", select: "name" });

      res.status(200).json({ message: "Cart item deleted", cart: updatedCart });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getCartItem = async (req, res) => {
  const userId = req.user;
  try {
    const cart = await Cart.findOne({ user: userId })
      .populate({ path: "items.foodItem", select: "name price images" })
      .populate({ path: "restaurant", select: "name" });

    if (!cart) {
      return res.status(404).json({ message: "No cart found" });
    } else {
      return res.status(200).json({ status: "success", data: cart });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
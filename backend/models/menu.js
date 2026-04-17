import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
  menu: [
    {
      category: {
        type: String,
        required: true,
      },
      items: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "FoodItem",
        },
      ],
    },
  ],
  restaurant: {
    type: mongoose.Schema.ObjectId,
    ref: "Restaurant",
    required: true,
  },
});

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
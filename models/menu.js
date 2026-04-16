const mongoose = require("mongoose");

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

module.exports = mongoose.model("Menu", menuSchema);

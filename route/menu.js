const express = require("express");
const router = express.Router({ mergeParams: true });

const { getMenusByRestaurant } = require("../controllers/menuController");

router.route("/").get(getMenusByRestaurant);

module.exports = router;

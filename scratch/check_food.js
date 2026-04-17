const mongoose = require('mongoose');
const FoodItem = require('./backend/models/foodItem');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    await mongoose.connect(process.env.DB_LOCAL_URI);
    const item = await FoodItem.findOne();
    console.log('Food Item:', JSON.stringify(item, null, 2));
    process.exit();
}
check();

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const connectDatabase = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log(`MongoDB Memory Server connected with HOST: ${mongoose.connection.host}`);
    
    return mongoServer;
  } catch (err) {
    console.log(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;

const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kheti';
  try {
    // Attempt standard connection first with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to ${uri}`);
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to standard URI (${uri}): ${err.message}`);
    console.log('[MongoDB] Attempting in-memory MongoDB fallback for local development/testing...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected to in-memory fallback instance at ${memUri}`);
    } catch (memErr) {
      console.error('[MongoDB] In-memory server fallback failed:', memErr.message);
      console.error('[MongoDB] Please ensure MongoDB is running locally or specify a valid MONGODB_URI in backend/.env');
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

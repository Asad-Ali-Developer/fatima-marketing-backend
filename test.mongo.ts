// test-mongo.js
const mongoose = require('mongoose');

const url =
  'mongodb+srv://asadalidev512:asadalidev512@love.5zpstbw.mongodb.net/?appName=Love';

async function test() {
  try {
    console.log('Testing MongoDB connection...');
    const conn = await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connection successful!');
    console.log('Database:', conn.connection.db.databaseName);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Connection failed:', error);
    if (error) console.error('Error code:', error);
    process.exit(1);
  }
}

test();

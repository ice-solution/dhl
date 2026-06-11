require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/super-stars';
  await mongoose.connect(uri);

  const existing = await User.findOne({ userId: 'demo' });
  if (existing) {
    console.log('Demo user already exists (userId: demo, password: demo123)');
    await mongoose.disconnect();
    return;
  }

  await User.create({
    userId: 'demo',
    password: 'demo123',
    category: 'Participant',
    businessUnit: 'DHL',
    title: 'Mr',
    fullName: 'Demo User',
  });

  console.log('Demo user created:');
  console.log('  User ID: demo');
  console.log('  Password: demo123');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

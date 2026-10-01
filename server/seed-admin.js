const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const adminEmail = 'admin@admin.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      branch: 'Main'
    });
    console.log('Admin user created successfully! (email: admin@admin.com, password: admin123)');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

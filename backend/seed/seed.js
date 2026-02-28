const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Initiative = require('../models/Initiative');
const Feedback = require('../models/Feedback');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedData = async () => {
  await connectDB();

  await Feedback.deleteMany();
  await Initiative.deleteMany();
  await User.deleteMany();

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const [admin, user] = await User.create([
    {
      name: 'System Admin',
      email: 'admin@smartcommunity.com',
      password: adminPassword,
      role: 'admin'
    },
    {
      name: 'Citizen User',
      email: 'user@smartcommunity.com',
      password: userPassword,
      role: 'user'
    }
  ]);

  const initiatives = await Initiative.create([
    {
      title: 'Ward 5 Waste Segregation Drive',
      description: 'Door-to-door waste segregation awareness and bin distribution campaign.',
      location: 'Ward 5, Central Zone',
      latitude: 22.5726,
      longitude: 88.3639,
      budget: 150000,
      budgetUsed: 90000,
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-04-10'),
      status: 'Ongoing',
      progressPercentage: 60
    },
    {
      title: 'Main Street Road Repair',
      description: 'Pothole filling and resurfacing of 4.2km main corridor.',
      location: 'Main Street, East Borough',
      latitude: 22.5853,
      longitude: 88.4173,
      budget: 300000,
      budgetUsed: 300000,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-20'),
      status: 'Completed',
      progressPercentage: 100
    },
    {
      title: 'North District Water Pipeline Upgrade',
      description: 'Replacement of old pipelines to improve water supply reliability.',
      location: 'North District',
      latitude: 22.6105,
      longitude: 88.3924,
      budget: 500000,
      budgetUsed: 120000,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-08-01'),
      status: 'Pending',
      progressPercentage: 15
    }
  ]);

  await Feedback.create([
    {
      initiative: initiatives[0]._id,
      user: user._id,
      comment: 'Please place extra bins near the market road.'
    },
    {
      initiative: initiatives[1]._id,
      user: user._id,
      comment: 'Road quality is much better now, thank you.'
    }
  ]);

  console.log('Dummy data seeded successfully');
  console.log('Admin login: admin@smartcommunity.com / Admin@123');
  console.log('User login: user@smartcommunity.com / User@123');

  process.exit(0);
};

seedData().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exit(1);
});

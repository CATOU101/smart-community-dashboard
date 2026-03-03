const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'Road & Infrastructure',
        'Waste Management',
        'Water Supply',
        'Street Lighting',
        'Public Parks',
        'Public Safety'
      ]
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    budget: {
      type: Number,
      required: true,
      min: 0
    },
    budgetUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Ongoing', 'Completed'],
      default: 'Pending'
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Initiative', initiativeSchema);

const mongoose = require('mongoose');

const issueRequestSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: [
        'Road & Infrastructure',
        'Waste Management',
        'Water Supply',
        'Street Lighting',
        'Public Parks',
        'Public Safety'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Converted'],
      default: 'Submitted'
    },
    flagged: {
      type: Boolean,
      default: false
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    convertedInitiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      default: null
    },
    images: {
      type: [String],
      default: []
    },
    upvotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('IssueRequest', issueRequestSchema);

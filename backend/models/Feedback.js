const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    initiative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Initiative',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);

const Feedback = require('../models/Feedback');

const addFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.create({
      initiative: req.body.initiative,
      user: req.user._id,
      comment: req.body.comment,
      imageData: req.body.imageData || null
    });

    const populated = await feedback.populate('user', 'name email role');
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to submit feedback' });
  }
};

const getFeedbackByInitiative = async (req, res) => {
  try {
    const feedback = await Feedback.find({ initiative: req.params.initiativeId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.json(feedback);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch feedback' });
  }
};

const getAllFeedback = async (_req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'name email')
      .populate('initiative', 'title status')
      .sort({ createdAt: -1 });

    return res.json(feedback);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch feedback list' });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete feedback' });
  }
};

module.exports = { addFeedback, getFeedbackByInitiative, getAllFeedback, deleteFeedback };

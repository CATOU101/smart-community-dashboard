const express = require('express');
const { body } = require('express-validator');
const {
  addFeedback,
  getFeedbackByInitiative,
  getAllFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('initiative').notEmpty().withMessage('Initiative id is required'),
    body('comment').trim().isLength({ min: 3, max: 500 }).withMessage('Comment must be between 3 and 500 chars')
  ],
  validate,
  addFeedback
);

router.get('/initiative/:initiativeId', protect, getFeedbackByInitiative);
router.get('/', protect, authorize('admin'), getAllFeedback);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const {
  createIssue,
  getAllIssues,
  getPublicApprovedIssues,
  getUserIssues,
  updateIssueStatus,
  upvoteIssue,
  convertIssueToInitiative
} = require('../controllers/issueController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

const categories = [
  'Road & Infrastructure',
  'Waste Management',
  'Water Supply',
  'Street Lighting',
  'Public Parks',
  'Public Safety'
];

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').isIn(categories).withMessage('Invalid category'),
    body('severity').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid severity'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('images').optional().isArray({ max: 5 }).withMessage('Images must be an array with max 5 items'),
    body('images.*')
      .optional()
      .isString()
      .isLength({ max: 3000000 })
      .withMessage('Image is too large')
      .custom((value) => value.startsWith('data:image/'))
      .withMessage('Invalid image format')
  ],
  validate,
  createIssue
);

router.get('/user', protect, getUserIssues);
router.get('/public', protect, getPublicApprovedIssues);
router.get('/', protect, authorize('admin'), getAllIssues);
router.post('/:id/upvote', protect, upvoteIssue);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  [
    body('status')
      .isIn(['Submitted', 'Under Review', 'Approved', 'Rejected', 'Converted'])
      .withMessage('Invalid status'),
    body('rejectionReason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .custom((value, { req }) => req.body.status !== 'Rejected' || String(value || '').trim().length > 0)
      .withMessage('Rejection reason is required when rejecting an issue')
  ],
  validate,
  updateIssueStatus
);
router.post('/:id/convert', protect, authorize('admin'), convertIssueToInitiative);

module.exports = router;

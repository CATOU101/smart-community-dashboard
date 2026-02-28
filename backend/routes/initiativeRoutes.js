const express = require('express');
const { body } = require('express-validator');
const {
  getAllInitiatives,
  getInitiativeById,
  getInitiativeCoordinates,
  createInitiative,
  updateInitiative,
  deleteInitiative
} = require('../controllers/initiativeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

const initiativeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a non-negative number'),
  body('budgetUsed').optional().isFloat({ min: 0 }).withMessage('Budget used must be non-negative'),
  body('startDate').isISO8601().withMessage('Start date must be valid'),
  body('endDate').isISO8601().withMessage('End date must be valid'),
  body('status').isIn(['Pending', 'Ongoing', 'Completed']).withMessage('Invalid status'),
  body('progressPercentage')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100')
];

router.get('/', protect, getAllInitiatives);
router.get('/coordinates', protect, getInitiativeCoordinates);
router.get('/:id', protect, getInitiativeById);
router.post('/', protect, authorize('admin'), initiativeValidation, validate, createInitiative);
router.put('/:id', protect, authorize('admin'), initiativeValidation, validate, updateInitiative);
router.delete('/:id', protect, authorize('admin'), deleteInitiative);

module.exports = router;

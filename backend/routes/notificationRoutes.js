const express = require('express');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/mark-read/:id', protect, markRead);
router.post('/mark-all-read', protect, markAllRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedbacks } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/', protect, authorize('admin'), getFeedbacks);

module.exports = router;

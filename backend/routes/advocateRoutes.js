const express = require('express');
const router = express.Router();
const {
  getAdvocateComplaints,
  replyToComplaint
} = require('../controllers/advocateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('advocate'));

router.get('/complaints', getAdvocateComplaints);
router.post('/complaints/:id/reply', replyToComplaint);

module.exports = router;

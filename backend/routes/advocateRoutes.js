const express = require('express');
const router = express.Router();
const {
  getAdvocateComplaints,
  replyToComplaint,
  getAvailability,
  addAvailability,
  deleteAvailability
} = require('../controllers/advocateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('advocate'));

router.get('/complaints', getAdvocateComplaints);
router.post('/complaints/:id/reply', replyToComplaint);

// Availability Routes
router.route('/availability')
  .get(getAvailability)
  .post(addAvailability);
router.delete('/availability/:slotId', deleteAvailability);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getComplaints,
  getComplaintById,
  askFollowUp,
  downloadPdfReport
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, authorize('citizen'), upload.array('documents', 5), submitComplaint)
  .get(protect, getComplaints);

router.route('/:id')
  .get(protect, getComplaintById);

router.route('/:id/chat')
  .post(protect, authorize('citizen'), askFollowUp);

router.route('/:id/pdf')
  .get(protect, downloadPdfReport);

module.exports = router;

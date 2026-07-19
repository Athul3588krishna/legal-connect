const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getComplaints,
  getComplaintById,
  askFollowUp,
  downloadPdfReport,
  requestVideoSlot,
  scheduleVideoSlot,
  deleteVideoSlot,
  payConsultationFee,
  translateComplaintReport
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, authorize('citizen'), upload.array('documents', 5), submitComplaint)
  .get(protect, getComplaints);

router.route('/:id')
  .get(protect, getComplaintById);

router.route('/:id/translate')
  .post(protect, translateComplaintReport);

router.route('/:id/chat')
  .post(protect, authorize('citizen'), askFollowUp);

router.route('/:id/pdf')
  .get(protect, downloadPdfReport);

router.route('/:id/slots/request')
  .post(protect, authorize('citizen'), requestVideoSlot);

router.route('/:id/slots/:slotId/schedule')
  .put(protect, authorize('advocate'), scheduleVideoSlot);

router.route('/:id/slots/:slotId')
  .delete(protect, authorize('citizen'), deleteVideoSlot);

router.route('/:id/replies/:replyId/pay')
  .post(protect, authorize('citizen'), payConsultationFee);

module.exports = router;

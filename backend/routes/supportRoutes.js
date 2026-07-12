const express = require('express');
const router = express.Router();
const Support = require('../models/Support');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Submit support query form
// @route   POST /api/support
// @access  Public
router.post('/', async (req, res, next) => {
  const { name, email, subject, message } = req.body;
  try {
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all fields.' });
    }

    const ticket = await Support.create({ name, email, subject, message });

    // Send notifications to all Admins about new support ticket
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        message: `New support inquiry: "${subject}" submitted by ${name}.`,
        type: 'complaint'
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Support inquiry logged successfully. Our team will review this shortly.', 
      ticket 
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all support queries
// @route   GET /api/support
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await Support.countDocuments();
    const tickets = await Support.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      tickets
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle resolve status of support ticket
// @route   PUT /api/support/:id/resolve
// @access  Private (Admin)
router.put('/:id/resolve', protect, authorize('admin'), async (req, res, next) => {
  try {
    const ticket = await Support.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support query not found.' });
    }
    ticket.isResolved = !ticket.isResolved;
    await ticket.save();

    res.status(200).json({ 
      success: true, 
      message: `Inquiry status updated to ${ticket.isResolved ? 'resolved' : 'pending'}.`, 
      ticket 
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete support inquiry
// @route   DELETE /api/support/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const ticket = await Support.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support query not found.' });
    }
    await ticket.deleteOne();
    res.status(200).json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

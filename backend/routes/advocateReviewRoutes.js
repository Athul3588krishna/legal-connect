const express = require('express');
const router = express.Router();
const AdvocateReview = require('../models/AdvocateReview');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Submit a review for an advocate
// @route   POST /api/advocates/:advocateId/reviews
// @access  Private (Citizen)
router.post('/:advocateId/reviews', protect, authorize('citizen'), async (req, res, next) => {
  const { rating, reviewText } = req.body;
  const advocateId = req.params.advocateId;

  try {
    if (!rating || !reviewText) {
      return res.status(400).json({ success: false, message: 'Please provide rating and review comment.' });
    }

    const advocate = await User.findOne({ _id: advocateId, role: 'advocate' });
    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    }

    // Check if citizen has already reviewed this advocate
    const alreadyReviewed = await AdvocateReview.findOne({
      citizen: req.user.id,
      advocate: advocateId
    });

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this advocate.' });
    }

    const review = await AdvocateReview.create({
      citizen: req.user.id,
      advocate: advocateId,
      rating: parseInt(rating, 10),
      reviewText
    });

    res.status(201).json({ 
      success: true, 
      message: 'Thank you! Your advocate review has been logged.', 
      review 
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all reviews for an advocate
// @route   GET /api/advocates/:advocateId/reviews
// @access  Public
router.get('/:advocateId/reviews', async (req, res, next) => {
  const advocateId = req.params.advocateId;
  try {
    const reviews = await AdvocateReview.find({ advocate: advocateId })
      .populate('citizen', 'username profileImage')
      .sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
      averageRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      reviews
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get public availability slots of an advocate
// @route   GET /api/advocates/:advocateId/availability
// @access  Private (Citizen/Advocate/Admin)
router.get('/:advocateId/availability', protect, async (req, res, next) => {
  const advocateId = req.params.advocateId;

  try {
    const advocate = await User.findOne({ _id: advocateId, role: 'advocate' });
    if (!advocate) {
      return res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    }

    // Filter slots to only include future and unbooked ones
    const now = new Date();
    const slots = advocate.availabilitySlots
      .filter(s => !s.isBooked && new Date(s.time) > now)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    res.status(200).json({ success: true, slots });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

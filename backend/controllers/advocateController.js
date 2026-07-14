const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

/**
 * @desc    Get all consultation requests for advocates
 * @route   GET /api/advocate/complaints
 * @access  Private (Advocate)
 */
const getAdvocateComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter type: 'all' (all pending cases), 'my_responses' (cases where advocate replied)
    if (req.query.filter === 'my_responses') {
      query['advocateReplies.advocate'] = req.user.id;
    } else {
      // Default: show pending or under-review cases
      query.status = { $in: ['pending', 'under_review'] };
    }

    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizen', 'username email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: complaints.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add official advocate reply to citizen case
 * @route   POST /api/advocate/complaints/:id/reply
 * @access  Private (Advocate)
 */
const replyToComplaint = async (req, res, next) => {
  const { message, status, includeVideoCall, consultationFee } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please enter a response message' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    let videoMeetingUrl = '';
    if (includeVideoCall) {
      const cleanTitle = complaint.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
      videoMeetingUrl = `https://meet.jit.si/LegalAssist-Consultation-${cleanTitle}-${complaint._id}`;
    }

    // Add reply
    complaint.advocateReplies.push({
      advocate: req.user.id,
      message,
      replyDate: new Date(),
      videoMeetingUrl,
      consultationFee: consultationFee ? Number(consultationFee) : 500
    });

    // Update status if provided, else transition to 'under_review'
    if (status && ['under_review', 'resolved'].includes(status)) {
      complaint.status = status;
    } else {
      complaint.status = 'under_review';
    }

    await complaint.save();

    // Create Notification for the citizen
    await Notification.create({
      user: complaint.citizen,
      message: `Advocate ${req.user.username} has provided legal guidance on your case: "${complaint.title}".`,
      type: 'reply'
    });

    res.status(200).json({
      success: true,
      message: 'Guidance response submitted successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdvocateComplaints,
  replyToComplaint
};

const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const pdfService = require('../services/pdfService');

/**
 * @desc    Submit a new complaint
 * @route   POST /api/complaints
 * @access  Private (Citizen)
 */
const submitComplaint = async (req, res, next) => {
  const { title, description, incidentDate, state, district, category } = req.body;

  try {
    if (!title || !description || !incidentDate || !state || !district) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    // Process uploaded documents
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          filename: file.filename
        });
      });
    }

    // Initialize temporary schema structure while AI loads
    const initialAIResponse = {
      summary: "Analyzing case...",
      classification: category || "General",
      applicableLaws: [],
      suggestedAuthority: "Identifying suitable forum...",
      requiredDocuments: [],
      stepByStepProcedure: [],
      nextActions: [],
      preventiveTips: [],
      faqs: [],
      disclaimer: "This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions."
    };

    // Create the complaint in database first (so we have an ID)
    let complaint = await Complaint.create({
      citizen: req.user.id,
      title,
      description,
      incidentDate,
      state,
      district,
      category: category || 'General',
      documents,
      status: 'pending',
      aiResponse: initialAIResponse
    });

    // Run Gemini AI guidance in background or synchronously.
    // To give a smooth user experience, we can await it here, or run it async.
    // The request wants complete output with loading states, so let's run it synchronously
    // to populate the DB immediately before responding, ensuring reliable state.
    const aiGuidanceResult = await geminiService.generateLegalGuidance(
      title,
      description,
      category,
      state,
      district
    );

    complaint.aiResponse = aiGuidanceResult;
    await complaint.save();

    // Create Notification for the citizen
    await Notification.create({
      user: req.user.id,
      message: `Your complaint "${title}" has been submitted and analysed by AI. View your dashboard for the legal guide.`,
      type: 'complaint'
    });

    // Create Notification for all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        message: `New citizen complaint submitted: "${title}" in ${district}, ${state}.`,
        type: 'complaint'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully and analyzed by AI.',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints (Citizen: own, Advocate/Admin: all)
 * @route   GET /api/complaints
 * @access  Private
 */
const getComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Build query conditions
    const query = {};

    // Citizens can only view their own complaints
    if (req.user.role === 'citizen') {
      query.citizen = req.user.id;
    }

    // Apply Search Filters
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }
    if (req.query.state && req.query.state !== 'All') {
      query.state = req.query.state;
    }
    if (req.query.startDate && req.query.endDate) {
      query.incidentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Sorting
    let sortBy = { createdAt: -1 };
    if (req.query.sort) {
      const parts = req.query.sort.split(':');
      sortBy = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizen', 'username email')
      .sort(sortBy)
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
 * @desc    Get single complaint details
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'username email profileImage')
      .populate('advocateReplies.advocate', 'username email profileImage');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Restrict citizen from viewing other citizens' complaints
    if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ask follow-up questions to Gemini AI legal assistant
 * @route   POST /api/complaints/:id/chat
 * @access  Private (Citizen)
 */
const askFollowUp = async (req, res, next) => {
  const { message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please enter a message' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.citizen.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to chat about this case' });
    }

    // Append user message to history
    complaint.followUpChat.push({
      role: 'user',
      message,
      timestamp: new Date()
    });

    // Run Gemini Chat response
    const complaintSummaryInfo = {
      title: complaint.title,
      category: complaint.category,
      description: complaint.description
    };

    const aiReply = await geminiService.getChatReply(
      complaint.followUpChat,
      message,
      complaintSummaryInfo
    );

    // Append model response to history
    complaint.followUpChat.push({
      role: 'model',
      message: aiReply,
      timestamp: new Date()
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      chat: complaint.followUpChat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download legal report as PDF
 * @route   GET /api/complaints/:id/pdf
 * @access  Private
 */
const downloadPdfReport = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'username email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'citizen' && complaint.citizen._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this report' });
    }

    // Set headers for file transfer
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LegalAssist_Report_${complaint._id}.pdf`);

    // Stream PDF directly to client response
    pdfService.generateComplaintPDF(complaint, res);

    // Create Notification about PDF report generation
    await Notification.create({
      user: complaint.citizen._id,
      message: `Your legal report for case "${complaint.title}" has been successfully exported as PDF.`,
      type: 'report'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getComplaints,
  getComplaintById,
  askFollowUp,
  downloadPdfReport
};

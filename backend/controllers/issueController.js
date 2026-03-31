const IssueRequest = require('../models/IssueRequest');
const Initiative = require('../models/Initiative');
const { createNotification } = require('./notificationController');

const PRIVATE_PLACES = [
  'house',
  'home',
  'apartment',
  'flat',
  'room',
  'bathroom',
  'bedroom',
  'kitchen',
  'toilet',
  'roof',
  'gate',
  'wall',
  'pipe',
  'drain',
  'ceiling',
  'balcony',
  'garage',
  'floor'
];

const PERSONAL_WORDS = ['my', 'mine', 'inside my', 'in my', 'at my', 'our house', 'our home'];

const PRIVATE_COMBO_REGEX =
  /\b(my|our)\s+(house|home|apartment|flat|room|bathroom|bedroom|kitchen|toilet|roof|gate|wall|pipe|drain|ceiling|garage)\b/i;

const buildIssueText = ({ title, description }) =>
  `${String(title || '')} ${String(description || '')}`.toLowerCase().trim();

const computePrivateScore = ({ title, description }) => {
  const text = buildIssueText({ title, description });
  let score = 0;

  if (!text) {
    return { score, text };
  }

  // Personal ownership/context strongly signals non-community issue.
  if (PERSONAL_WORDS.some((word) => text.includes(word))) {
    score += 2;
  }

  // Private place terms add weaker evidence by themselves.
  if (PRIVATE_PLACES.some((place) => text.includes(place))) {
    score += 1;
  }

  // "my/our + private place" is the strongest explicit private signal.
  if (PRIVATE_COMBO_REGEX.test(text)) {
    score += 3;
  }

  return { score, text };
};

const createIssue = async (req, res) => {
  try {
    const { score } = computePrivateScore({
      title: req.body.title,
      description: req.body.description
    });

    // Threshold 3 balances false positives and catches clear personal requests.
    // We only flag for review; admins decide final action.
    const flagged = score >= 3;
    const status = flagged ? 'Under Review' : 'Submitted';

    const issue = await IssueRequest.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      severity: req.body.severity || 'Medium',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      images: req.body.images || [],
      submittedBy: req.user._id,
      flagged,
      status
    });

    return res.status(201).json(issue);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create issue request' });
  }
};

const getPublicApprovedIssues = async (req, res) => {
  try {
    const issues = await IssueRequest.find({ status: 'Approved' })
      .select('title description category severity latitude longitude status createdAt upvotes')
      .sort({ createdAt: -1 });

    const currentUserId = String(req.user._id);
    const mappedIssues = issues.map((issue) => {
      const upvotes = Array.isArray(issue.upvotes) ? issue.upvotes : [];

      return {
        ...issue.toObject(),
        upvoteCount: upvotes.length,
        hasSupported: upvotes.some((userId) => String(userId) === currentUserId)
      };
    });

    return res.json(mappedIssues);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch approved issues' });
  }
};

const getAllIssues = async (_req, res) => {
  try {
    const issues = await IssueRequest.find({})
      .populate('submittedBy', 'name email')
      .populate('convertedInitiative', 'title')
      .sort({ createdAt: -1 });

    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch issue requests' });
  }
};

const getUserIssues = async (req, res) => {
  try {
    const issues = await IssueRequest.find({ submittedBy: req.user._id })
      .populate('convertedInitiative', 'title')
      .sort({ createdAt: -1 });

    return res.json(issues);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user issue requests' });
  }
};

const updateIssueStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const issue = await IssueRequest.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    const previousStatus = issue.status;
    issue.status = status;
    issue.rejectionReason = status === 'Rejected' ? rejectionReason || '' : '';
    await issue.save();

    if (status === 'Approved' && previousStatus !== 'Approved') {
      await createNotification({
        userId: issue.submittedBy,
        message: 'Your issue has been approved.',
        link: `/issues/${issue._id}`
      });
    }

    if (status === 'Rejected' && previousStatus !== 'Rejected') {
      const reasonText = issue.rejectionReason ? ` Reason: ${issue.rejectionReason}` : '';
      await createNotification({
        userId: issue.submittedBy,
        message: `Your issue was rejected.${reasonText}`,
        link: `/issues/${issue._id}`
      });
    }

    return res.json(issue);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update issue status' });
  }
};

const upvoteIssue = async (req, res) => {
  try {
    const issue = await IssueRequest.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    if (issue.status !== 'Approved') {
      return res.status(400).json({ message: 'Only approved issues can be supported' });
    }

    if (!Array.isArray(issue.upvotes)) {
      issue.upvotes = [];
    }

    const currentUserId = String(req.user._id);
    const alreadySupported = issue.upvotes.some((userId) => String(userId) === currentUserId);

    if (alreadySupported) {
      issue.upvotes = issue.upvotes.filter((userId) => String(userId) !== currentUserId);
      await issue.save();

      return res.json({
        message: 'Support removed',
        supported: false,
        upvoteCount: issue.upvotes.length
      });
    }

    issue.upvotes.push(req.user._id);
    await issue.save();

    return res.json({
      message: 'Issue supported',
      supported: true,
      upvoteCount: issue.upvotes.length
    });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update issue support' });
  }
};

const convertIssueToInitiative = async (req, res) => {
  try {
    const issue = await IssueRequest.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    if (issue.status !== 'Approved') {
      return res.status(400).json({ message: 'Only approved issues can be converted' });
    }

    if (issue.convertedInitiative) {
      return res.status(400).json({ message: 'Issue already converted' });
    }

    // Conversion defaults per requirement.
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 6);

    const initiative = await Initiative.create({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      location: `Lat ${issue.latitude.toFixed(5)}, Lng ${issue.longitude.toFixed(5)}`,
      latitude: issue.latitude,
      longitude: issue.longitude,
      status: 'Pending',
      progressPercentage: 0,
      budget: 0,
      budgetUsed: 0,
      startDate: now,
      endDate: end
    });

    issue.status = 'Converted';
    issue.convertedInitiative = initiative._id;
    await issue.save();

    await createNotification({
      userId: issue.submittedBy,
      message: 'Your issue was converted to an initiative.',
      link: `/initiatives/${initiative._id}`
    });

    return res.json({ message: 'Issue converted to initiative', issue, initiative });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to convert issue request' });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getPublicApprovedIssues,
  getUserIssues,
  updateIssueStatus,
  upvoteIssue,
  convertIssueToInitiative
};

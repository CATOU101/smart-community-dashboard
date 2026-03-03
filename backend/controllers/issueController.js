const IssueRequest = require('../models/IssueRequest');
const Initiative = require('../models/Initiative');

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

const getAllIssues = async (_req, res) => {
  try {
    const issues = await IssueRequest.find()
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

    issue.status = status;
    issue.rejectionReason = status === 'Rejected' ? rejectionReason || '' : '';
    await issue.save();

    return res.json(issue);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update issue status' });
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

    return res.json({ message: 'Issue converted to initiative', issue, initiative });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to convert issue request' });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getUserIssues,
  updateIssueStatus,
  convertIssueToInitiative
};

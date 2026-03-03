const IssueRequest = require('../models/IssueRequest');
const Initiative = require('../models/Initiative');

const PRIVATE_KEYWORDS = [
  'my house',
  'my wall',
  'my sink',
  'apartment',
  'bathroom',
  'bedroom',
  'kitchen',
  'toilet',
  'roof leak',
  'my room',
  'inside my home'
];

const PRIVATE_MY_PATTERN = /\bmy\s+(house|wall|sink|apartment|bathroom|bedroom|kitchen|toilet|roof|room|pipe|drain|gate)\b/i;

const hasPrivateKeyword = ({ title, description }) => {
  const text = `${String(title || '')} ${String(description || '')}`.toLowerCase();
  return PRIVATE_KEYWORDS.some((keyword) => text.includes(keyword)) || PRIVATE_MY_PATTERN.test(text);
};

const createIssue = async (req, res) => {
  try {
    // Private/personal issue content in title/description gets auto-flagged for manual admin review.
    const flagged = hasPrivateKeyword({
      title: req.body.title,
      description: req.body.description
    });
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

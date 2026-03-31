const Initiative = require('../models/Initiative');
const IssueRequest = require('../models/IssueRequest');
const { createNotification } = require('./notificationController');

const getAllInitiatives = async (_req, res) => {
  try {
    const initiatives = await Initiative.find({}).sort({ createdAt: -1 });
    return res.json(initiatives);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch initiatives' });
  }
};

const getInitiativeById = async (req, res) => {
  try {
    const initiative = await Initiative.findById(req.params.id);
    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    return res.json(initiative);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid initiative id' });
  }
};

const getInitiativeCoordinates = async (_req, res) => {
  try {
    const initiatives = await Initiative.find({})
      .select('title status progressPercentage latitude longitude')
      .sort({ createdAt: -1 });

    const mapped = initiatives.filter(
      (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch initiative coordinates' });
  }
};

const createInitiative = async (req, res) => {
  try {
    const initiative = await Initiative.create(req.body);
    return res.status(201).json(initiative);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create initiative' });
  }
};

const updateInitiative = async (req, res) => {
  try {
    const existingInitiative = await Initiative.findById(req.params.id);
    if (!existingInitiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    const previousStatus = existingInitiative.status;
    Object.assign(existingInitiative, req.body);
    await existingInitiative.save();

    if (previousStatus !== 'Completed' && existingInitiative.status === 'Completed') {
      const linkedIssue = await IssueRequest.findOne({ convertedInitiative: existingInitiative._id }).select(
        'submittedBy'
      );

      if (linkedIssue?.submittedBy) {
        await createNotification({
          userId: linkedIssue.submittedBy,
          message: `An initiative created from your issue has been completed: ${existingInitiative.title}.`,
          link: `/initiatives/${existingInitiative._id}`
        });
      }
    }

    return res.json(existingInitiative);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update initiative' });
  }
};

const deleteInitiative = async (req, res) => {
  try {
    const initiative = await Initiative.findByIdAndDelete(req.params.id);

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    return res.json({ message: 'Initiative deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to delete initiative' });
  }
};

module.exports = {
  getAllInitiatives,
  getInitiativeById,
  getInitiativeCoordinates,
  createInitiative,
  updateInitiative,
  deleteInitiative
};

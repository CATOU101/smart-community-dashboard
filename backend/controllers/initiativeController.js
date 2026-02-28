const Initiative = require('../models/Initiative');

const getAllInitiatives = async (_req, res) => {
  try {
    const initiatives = await Initiative.find().sort({ createdAt: -1 });
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
    const initiatives = await Initiative.find()
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
    const initiative = await Initiative.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!initiative) {
      return res.status(404).json({ message: 'Initiative not found' });
    }

    return res.json(initiative);
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

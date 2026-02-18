const Faculty = require('../models/Faculty');

exports.getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.getAll();
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.getById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.update(req.params.id, req.body);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.delete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    res.json({ message: 'Faculty deleted successfully', faculty });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

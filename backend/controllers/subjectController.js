const Subject = require('../models/Subject');

exports.getAllSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const subjects = await Subject.getAll({ department });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.getById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.update(req.params.id, req.body);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.delete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully', subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

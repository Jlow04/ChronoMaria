const AuditLog = require('../models/AuditLog');

exports.getAll = async (req, res) => {
  try {
    const logs = await AuditLog.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
};

exports.getByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const logs = await AuditLog.getByAction(action);
    res.json(logs);
  } catch (error) {
    console.error('Get audit logs by action error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
};

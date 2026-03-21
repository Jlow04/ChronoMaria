const Room = require('../models/Room');

const normalizeRoomPayload = (input = {}) => {
  const commonRoom = Boolean(input.is_common_room ?? input.common_room ?? false);
  return {
    ...input,
    is_common_room: commonRoom,
    common_room: commonRoom,
    room_department: commonRoom ? null : (input.room_department ?? input.department ?? null),
    department: commonRoom ? null : (input.department ?? input.room_department ?? null),
  };
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.getAll();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.getById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const payload = normalizeRoomPayload(req.body);

    if (!payload.room_number && !payload.room_code) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    if (!payload.capacity || Number(payload.capacity) <= 0) {
      return res.status(400).json({ error: 'Capacity must be a positive number' });
    }

    const room = await Room.create(payload);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const payload = normalizeRoomPayload(req.body);
    const room = await Room.update(req.params.id, payload);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.delete(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully', room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

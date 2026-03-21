const supabase = require('../config/database');

class Room {
  static normalizeData(data) {
    if (Array.isArray(data)) {
      return data.map((item) => Room.normalizeData(item));
    }

    if (!data) return data;

    return {
      ...data,
      // Backward-compatible aliases for frontend semantics
      room_code: data.room_code ?? data.room_number ?? null,
      description: data.building ?? null,
      department: data.room_department ?? null,
      room_type: data.room_type ?? data.type ?? null,
      subject_type: data.subject_type ?? null,
      status: data.status ?? 'Available',
      common_room: data.is_common_room ?? false,
    };
  }

  static buildPayload(roomData) {
    const roomCode = roomData.room_code ?? roomData.room_number ?? null;
    const description = roomData.building ?? roomData.description ?? null;
    const roomType = roomData.room_type ?? roomData.type ?? null;
    const subjectType = roomData.subject_type ?? null;
    const status = roomData.status ?? 'Available';
    const commonRoom = Boolean(roomData.is_common_room ?? roomData.common_room ?? false);
    const department = commonRoom ? null : (roomData.room_department ?? roomData.department ?? null);

    return {
      room_code: roomCode,
      building: description,
      capacity: roomData.capacity,
      type: roomType,
      room_type: roomType,
      subject_type: subjectType,
      status,
      is_common_room: commonRoom,
      room_department: department,
    };
  }

  static buildLegacyPayload(roomData) {
    const roomCode = roomData.room_code ?? roomData.room_number ?? null;
    const description = roomData.building ?? roomData.description ?? null;
    const roomType = roomData.room_type ?? roomData.type ?? null;
    const subjectType = roomData.subject_type ?? null;
    const status = roomData.status ?? 'Available';
    const commonRoom = Boolean(roomData.is_common_room ?? roomData.common_room ?? false);
    const department = commonRoom ? null : (roomData.room_department ?? roomData.department ?? null);

    return {
      room_number: roomCode,
      building: description,
      capacity: roomData.capacity,
      type: roomType,
      room_type: roomType,
      subject_type: subjectType,
      status,
      is_common_room: commonRoom,
      room_department: department,
    };
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return Room.normalizeData(data);
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return Room.normalizeData(data);
  }

  static async create(roomData) {
    const payload = Room.buildPayload(roomData);
    const { data, error } = await supabase
      .from('rooms')
      .insert([payload])
      .select()
      .single();

    if (!error) return Room.normalizeData(data);

    // Compatibility fallback for schemas that still use room_number.
    const fallbackPayload = Room.buildLegacyPayload(roomData);
    const fallback = await supabase
      .from('rooms')
      .insert([fallbackPayload])
      .select()
      .single();

    if (fallback.error) throw fallback.error;
    return Room.normalizeData(fallback.data);
  }

  static async update(id, roomData) {
    const payload = Room.buildPayload(roomData);
    const { data, error } = await supabase
      .from('rooms')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error) return Room.normalizeData(data);

    // Compatibility fallback for schemas that still use room_number.
    const fallbackPayload = Room.buildLegacyPayload(roomData);
    const fallback = await supabase
      .from('rooms')
      .update(fallbackPayload)
      .eq('id', id)
      .select()
      .single();

    if (fallback.error) throw fallback.error;
    return Room.normalizeData(fallback.data);
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return Room.normalizeData(data);
  }
}

module.exports = Room;

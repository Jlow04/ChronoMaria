const supabase = require('../config/database');

class Room {
  static async getAll(options = {}) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id');

    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(roomData) {
    const { room_number, building, capacity, type, department_id } = roomData;
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ room_number, building, capacity, type, department_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, roomData) {
    const { room_number, building, capacity, type, department_id } = roomData;
    const { data, error } = await supabase
      .from('rooms')
      .update({ room_number, building, capacity, type, department_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { data, error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = Room;

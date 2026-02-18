const supabase = require('../config/database');

class Room {
  static async getAll() {
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
    const { room_number, building, capacity, type } = roomData;
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ room_number, building, capacity, type }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, roomData) {
    const { room_number, building, capacity, type } = roomData;
    const { data, error } = await supabase
      .from('rooms')
      .update({ room_number, building, capacity, type })
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

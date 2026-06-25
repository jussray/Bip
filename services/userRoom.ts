import { getSupabase } from '../utils/supabase';
import type { UserRoomConfig, PlacedItem } from '../screens/UserRoomScreen';

type UserRoomRow = {
  user_id:       string;
  base_room_id:  string;
  lighting_mode: string;
  companion_id:  string;
  room_name:     string;
  placed_items:  unknown;
  vibe_overlay:  string;
  room_quote:    string;
  glow_color:    string;
  updated_at:    string;
};

function rowToConfig(row: UserRoomRow): Partial<UserRoomConfig> {
  return {
    baseRoomId:   row.base_room_id  as UserRoomConfig['baseRoomId'],
    lightingMode: row.lighting_mode as UserRoomConfig['lightingMode'],
    companionId:  row.companion_id  as UserRoomConfig['companionId'],
    roomName:     row.room_name,
    placedItems:  Array.isArray(row.placed_items) ? (row.placed_items as PlacedItem[]) : [],
    vibeOverlay:  row.vibe_overlay,
    roomQuote:    row.room_quote,
    glowColor:    row.glow_color,
  };
}

function configToRow(userId: string, config: UserRoomConfig): Omit<UserRoomRow, 'updated_at'> {
  return {
    user_id:       userId,
    base_room_id:  config.baseRoomId,
    lighting_mode: config.lightingMode,
    companion_id:  config.companionId,
    room_name:     config.roomName,
    placed_items:  config.placedItems,
    vibe_overlay:  config.vibeOverlay,
    room_quote:    config.roomQuote,
    glow_color:    config.glowColor,
  };
}

export async function loadUserRoom(): Promise<Partial<UserRoomConfig> | null> {
  try {
    const db = getSupabase();
    if (!db) return null;

    const { data: { user } } = await db.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('user_rooms')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return rowToConfig(data as UserRoomRow);
  } catch {
    return null;
  }
}

export async function saveUserRoom(config: UserRoomConfig): Promise<boolean> {
  try {
    const db = getSupabase();
    if (!db) return false;

    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;

    const { error } = await db
      .from('user_rooms')
      .upsert(configToRow(user.id, config), { onConflict: 'user_id' });

    return !error;
  } catch {
    return false;
  }
}

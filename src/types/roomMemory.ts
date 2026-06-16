export interface RoomMemory {
  character:   string;
  lastVisit:   string;
  lastHotspot: string;
  lastSummon:  string;
  visitCount:  number;
}

export const DEFAULT_ROOM_MEMORY: RoomMemory = {
  character:   'raylene',
  lastVisit:   '',
  lastHotspot: '',
  lastSummon:  '',
  visitCount:  0,
};

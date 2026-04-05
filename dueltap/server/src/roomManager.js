const rooms = new Map();
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId, hostName) {
  const code = generateCode();
  const room = {
    code,
    hostId,
    status: 'waiting', // waiting | countdown | playing | results
    players: [{ id: hostId, name: hostName, score: 0, rtt: 100 }],
    game: null,
    disconnectTimers: {},
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code, socketId, playerName) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: 'Sala no encontrada' };
  if (room.players.length >= 2) return { error: 'Sala llena' };
  if (room.status !== 'waiting' && room.status !== 'results') {
    return { error: 'Partida en curso' };
  }
  room.players.push({ id: socketId, name: playerName, score: 0, rtt: 100 });
  return { room };
}

export function getRoom(code) {
  return rooms.get(code.toUpperCase());
}

export function getRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.id === playerId)) return room;
  }
  return null;
}

export function removeRoom(code) {
  rooms.delete(code.toUpperCase());
}

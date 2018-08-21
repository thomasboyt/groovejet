import Room from './Room';

// magical singleton state here~
const rooms = new Map<string, Room>();

function generateCode(length: number): string {
  // https://stackoverflow.com/a/19964557
  return (Math.random().toString(36) + '00000000000000000').slice(
    2,
    length + 2
  );
}

function getRoomCode(): string {
  for (let tries = 0; tries < 10; tries += 1) {
    const code = generateCode(5);
    if (!rooms.has(code)) {
      return code;
    }
  }

  throw new Error('could not generate a unique room code after 10 tries');
}

export function createRoom(): Room {
  const roomCode = getRoomCode();
  const room = new Room(roomCode);
  rooms.set(roomCode, room);
  return room;
}

export default rooms;

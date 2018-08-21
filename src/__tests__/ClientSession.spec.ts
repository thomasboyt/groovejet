import ClientSession from '../ClientSession';
import MockSocket from '../__mocks__/ClientSocket';
import {
  SIdentityMessage,
  SCreatedRoomMessage,
  SJoinedRoomMessage,
  NoRoomFoundErrorMessage,
  HostDisconnectedErrorMessage,
} from '../messages';

function connect() {
  const socket = new MockSocket();
  const session = new ClientSession(socket);
  session.sendIdentity();
  return { socket, session };
}

describe('ClientSession', () => {
  describe('sendIdentity', () => {
    it('sends client ID to client', () => {
      const { socket } = connect();

      const expected: SIdentityMessage = {
        type: 'identity',
        data: {
          clientId: 'clientId',
        },
      };

      expect(socket.sentMessages[0]).toEqual(expected);
    });
  });

  describe('msg: createRoom', () => {
    it('creates and hosts a new room', () => {
      const { socket, session } = connect();

      socket.onMessage.call({
        type: 'createRoom',
      });

      const expected: SCreatedRoomMessage = {
        type: 'createdRoom',
        data: {
          roomCode: session['room']!.roomCode,
        },
      };
      expect(socket.sentMessages[1]).toEqual(expected);
    });
  });

  describe('msg: joinRoom', () => {
    it('joins as guest if host is present', () => {
      const { socket: hostSocket } = connect();

      hostSocket.onMessage.call({
        type: 'createRoom',
      });

      expect(hostSocket.sentMessages[1].type).toEqual('createdRoom');
      const roomCode = (hostSocket.sentMessages[1] as SCreatedRoomMessage).data
        .roomCode;

      const { socket: clientSocket } = connect();

      clientSocket.onMessage.call({
        type: 'joinRoom',
        data: {
          roomCode,
          canHost: true,
        },
      });

      const expected: SJoinedRoomMessage = {
        type: 'joinedRoom',
        data: {
          isHost: false,
        },
      };

      expect(clientSocket.sentMessages[1]).toEqual(expected);
    });

    it('joins as host if no host is present', () => {
      const { socket: hostSocket } = connect();

      hostSocket.onMessage.call({
        type: 'createRoom',
      });

      expect(hostSocket.sentMessages[1].type).toEqual('createdRoom');
      const roomCode = (hostSocket.sentMessages[1] as SCreatedRoomMessage).data
        .roomCode;

      hostSocket.close();

      const { socket: clientSocket } = connect();

      clientSocket.onMessage.call({
        type: 'joinRoom',
        data: {
          roomCode,
          canHost: true,
        },
      });

      const expected: SJoinedRoomMessage = {
        type: 'joinedRoom',
        data: {
          isHost: true,
        },
      };

      expect(clientSocket.sentMessages[1]).toEqual(expected);
    });

    it('sends an error if the requested room does not exist', () => {
      const { socket: clientSocket } = connect();

      clientSocket.onMessage.call({
        type: 'joinRoom',
        data: {
          roomCode: '12345',
          canHost: true,
        },
      });

      const expected: Partial<NoRoomFoundErrorMessage> = {
        type: 'error',
        errorType: 'noRoomFound',
      };

      expect(clientSocket.sentMessages[1]).toMatchObject(expected);
    });

    it('sends an error if the requested room does not have a host and the client cannot host', () => {
      const { socket: hostSocket } = connect();

      hostSocket.onMessage.call({
        type: 'createRoom',
      });

      expect(hostSocket.sentMessages[1].type).toEqual('createdRoom');
      const roomCode = (hostSocket.sentMessages[1] as SCreatedRoomMessage).data
        .roomCode;

      hostSocket.close();

      const { socket: clientSocket } = connect();

      clientSocket.onMessage.call({
        type: 'joinRoom',
        data: {
          roomCode,
          canHost: false,
        },
      });

      const expected: Partial<HostDisconnectedErrorMessage> = {
        type: 'error',
        errorType: 'hostDisconnected',
      };

      expect(clientSocket.sentMessages[1]).toMatchObject(expected);
    });
  });
});

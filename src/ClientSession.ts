import { IClientSocket } from './ClientSocket';
import Room from './Room';
import rooms, { createRoom } from './rooms';

import {
  ClientMessage,
  ErrorMessage,
  MissingRoomCodeErrorMessage,
  NoRoomFoundErrorMessage,
  HostDisconnectedErrorMessage,
  SJoinedRoomMessage,
  SCreatedRoomMessage,
  SIdentityMessage,
} from './messages';

export default class ClientSession {
  private state: 'connected' | 'inRoom' = 'connected';
  private socket: IClientSocket;
  private room?: Room;

  constructor(socket: IClientSocket) {
    this.socket = socket;
    this.socket.onMessage.add(this.handleMessage);
  }

  sendIdentity() {
    const msg: SIdentityMessage = {
      type: 'identity',
      data: {
        clientId: this.socket.clientId,
      },
    };

    this.socket.send(msg);
  }

  fatalError(msg: ErrorMessage) {
    this.socket.send(msg);
    this.socket.close();
  }

  private handleMessage = (msg: ClientMessage) => {
    if (this.state === 'connected') {
      if (msg.type === 'joinRoom') {
        this.joinRoom(msg.data);
      } else if (msg.type === 'createRoom') {
        this.createRoom();
      }
    } else if (this.state === 'inRoom') {
      this.room!.handleSignalingMessage(this.socket.clientId, msg);
    }
  };

  private joinRoom({
    roomCode,
    canHost,
  }: {
    roomCode: string;
    canHost: boolean;
  }) {
    if (typeof roomCode !== 'string') {
      const msg: MissingRoomCodeErrorMessage = {
        type: 'error',
        errorType: 'missingRoomCode',
        errorMessage: 'Missing room code in request',
      };
      return this.fatalError(msg);
    }

    const room = rooms.get(roomCode);

    if (!room) {
      const msg: NoRoomFoundErrorMessage = {
        type: 'error',
        errorType: 'noRoomFound',
        errorMessage: `No room exists with code ${roomCode}`,
      };

      return this.fatalError(msg);
    }

    let isHost: boolean;
    if (!room.hasHost) {
      if (!canHost) {
        const msg: HostDisconnectedErrorMessage = {
          type: 'error',
          errorType: 'hostDisconnected',
          errorMessage: `No host connected for room ${roomCode}`,
        };

        return this.fatalError(msg);
      }

      room.registerHost(this.socket);
      isHost = true;
    } else {
      room.registerGuest(this.socket);
      isHost = false;
    }

    this.setRoom(room);

    const joinedMsg: SJoinedRoomMessage = {
      type: 'joinedRoom',
      data: {
        isHost,
      },
    };

    this.socket.send(joinedMsg);
  }

  private createRoom() {
    const room = createRoom();
    room.registerHost(this.socket);
    this.setRoom(room);

    const createdMsg: SCreatedRoomMessage = {
      type: 'createdRoom',
      data: {
        roomCode: room.roomCode,
      },
    };

    this.socket.send(createdMsg);
  }

  private setRoom(room: Room) {
    this.room = room;
    this.state = 'inRoom';
  }
}

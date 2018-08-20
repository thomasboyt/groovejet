import ClientSocket from './ClientSocket';
import {
  ClientMessage,
  SGuestSignalMessage,
  SHostSignalMessage,
  ServerMessage,
  HostDisconnectedErrorMessage,
  HostAlreadyExistsMessage,
} from './messages';

export default class Room {
  roomCode: string;
  private hostSocket?: ClientSocket;
  private guestSockets = new Map<string, ClientSocket>();

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  /**
   * Register a websocket as the current host.
   */
  registerHost(socket: ClientSocket) {
    if (this.hostSocket) {
      const errorMessage = `You're trying to connect as a host, but the room ${
        this.roomCode
      } already has a host`;

      const msg: HostAlreadyExistsMessage = {
        type: 'error',
        errorType: 'hostAlreadyExists',
        errorMessage,
      };

      socket.send(msg);
      socket.close();
      return;
    }

    socket.onMessage.add((msg) => this.handleHostMessage(msg));

    socket.onClose.add(() => {
      // TODO
      //
      // Host migration maybe goes here? Promote a guest to host, send message
      // to guest indicating that congratulations they are now host, and
      // messages to clients indicating there is a new host and they need to
      // reconnect.
      //
      // Until then, maybe just allow host to reconnect, somehow? Some kinda
      // unique host ID? (in this case we're assuming host keeps connections to
      // other peers, and only loses connection to the Groovejet server)

      this.hostSocket = undefined;
    });

    this.hostSocket = socket;
  }

  /**
   * Register a guest websocket.
   */
  registerGuest(socket: ClientSocket) {
    if (!this.hostSocket) {
      const msg: HostDisconnectedErrorMessage = {
        type: 'error',
        errorType: 'hostDisconnected',
        errorMessage: `The host for room ${this.roomCode} has disconnected`,
      };

      socket.send(msg);
      socket.close();
      return;
    }

    socket.onMessage.add((msg) => {
      this.handleGuestMessage(socket.clientId, msg);
    });

    socket.onClose.add(() => {
      this.guestSockets.delete(socket.clientId);
    });

    this.guestSockets.set(socket.clientId, socket);
  }

  private sendToGuest(clientId: string, data: ServerMessage) {
    const socket = this.guestSockets.get(clientId);

    if (!socket) {
      // TODO: properly handle disconnecting clients I guess
      return;
    }

    socket.send(data);
  }

  private sendToHost(data: ServerMessage) {
    if (!this.hostSocket) {
      // TODO: ???
      return;
    }

    this.hostSocket.send(data);
  }

  private handleGuestMessage(clientId: string, msg: ClientMessage) {
    if (msg.type === 'guestOfferSignal') {
      const msgToHost: SGuestSignalMessage = {
        type: 'guestOfferSignal',
        data: {
          offerSignal: msg.data.offerSignal,
          clientId,
        },
      };
      this.sendToHost(msgToHost);
    }
  }

  private handleHostMessage(msg: ClientMessage) {
    if (msg.type === 'hostAnswerSignal') {
      const { answerSignal, clientId } = msg.data;

      const msgToGuest: SHostSignalMessage = {
        type: 'hostAnswerSignal',
        data: {
          answerSignal,
        },
      };

      this.sendToGuest(clientId, msgToGuest);
    }
  }
}

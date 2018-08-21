import { IClientSocket } from './ClientSocket';
import {
  ClientMessage,
  ServerMessage,
  SGuestSignalMessage,
  SHostSignalMessage,
} from './messages';

export default class Room {
  roomCode: string;
  private hostSocket?: IClientSocket;
  private guestSockets = new Map<string, IClientSocket>();

  constructor(roomCode: string) {
    this.roomCode = roomCode;
  }

  /**
   * Register a websocket as the current host.
   */
  registerHost(socket: IClientSocket) {
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
  registerGuest(socket: IClientSocket) {
    socket.onClose.add(() => {
      this.guestSockets.delete(socket.clientId);
    });

    this.guestSockets.set(socket.clientId, socket);
  }

  get hasHost(): boolean {
    return !!this.hostSocket;
  }

  handleSignalingMessage(clientId: string, msg: ClientMessage) {
    if (!this.hostSocket) {
      return;
    }

    if (clientId === this.hostSocket.clientId) {
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
    } else {
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
}

import * as ws from 'ws';
import {
  ClientMessage,
  SGuestSignalMessage,
  SHostSignalMessage,
  ServerMessage,
} from './messages';

export default class Room {
  private hostWebSocket?: ws;
  private guestWebSockets = new Map<string, ws>();

  /**
   * Register a websocket as the current host.
   */
  registerHost(socket: ws) {
    socket.on('message', (strMsg: string) => {
      const msg = JSON.parse(strMsg);
      this.handleHostMessage(msg);
    });

    const interval = setInterval(() => {
      socket.ping();
    }, 10000);

    socket.on('close', () => {
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

      this.hostWebSocket = undefined;
      clearInterval(interval);
    });

    this.hostWebSocket = socket;
  }

  /**
   * Register a guest websocket.
   */
  registerGuest(socket: ws, clientId: string) {
    const interval = setInterval(() => {
      socket.ping();
    }, 10000);

    socket.on('message', (strMsg: string) => {
      const msg = JSON.parse(strMsg);
      this.handleGuestMessage(clientId, msg);
    });

    socket.on('close', () => {
      // TODO
      // Allow reconnections and stuff
      this.guestWebSockets.delete(clientId);
      clearInterval(interval);
    });

    this.guestWebSockets.set(clientId, socket);
  }

  private sendToGuest(clientId: string, data: ServerMessage) {
    const socket = this.guestWebSockets.get(clientId);

    if (!socket) {
      // TODO: properly handle disconnecting clients I guess
      return;
    }

    socket.send(JSON.stringify(data));
  }

  private sendToHost(data: ServerMessage) {
    if (!this.hostWebSocket) {
      // TODO: ???
      return;
    }

    this.hostWebSocket.send(JSON.stringify(data));
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

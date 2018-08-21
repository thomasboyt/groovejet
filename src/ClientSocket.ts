import * as ws from 'ws';
import * as uuidv4 from 'uuid/v4';

import Delegate from './Delegate';
import { ServerMessage, ErrorMessage, ClientMessage } from './messages';

export interface IClientSocket {
  clientId: string;
  onMessage: Delegate<ClientMessage>;
  onClose: Delegate<null>;

  send(msg: ServerMessage | ErrorMessage): void;
  close(): void;
}

export default class ClientSocket implements IClientSocket {
  clientId: string;
  onMessage = new Delegate<ClientMessage>();
  onClose = new Delegate();

  private socket: ws;
  private keepAliveInterval: NodeJS.Timer;

  constructor(socket: ws) {
    this.clientId = uuidv4();
    this.socket = socket;

    this.socket.on('message', (msg) => this.handleMessage(msg));

    this.keepAliveInterval = setInterval(() => {
      if (this.socket.readyState !== this.socket.OPEN) {
        return;
      }

      this.socket.ping();
    }, 10000);

    this.socket.on('close', () => {
      clearInterval(this.keepAliveInterval);
      this.onClose.call(null);
    });
  }

  send(msg: ServerMessage | ErrorMessage) {
    this.socket.send(JSON.stringify(msg));
  }

  close() {
    this.socket.close();
  }

  private handleMessage(unparsed: ws.Data) {
    if (typeof unparsed !== 'string') {
      console.error(`non-string msg received, ignoring`);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(unparsed);
    } catch (err) {
      console.error(`invalid json received, ignoring: ${unparsed}`);
      return;
    }

    this.onMessage.call(parsed);
  }
}

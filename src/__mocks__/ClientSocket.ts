import ClientSession from '../ClientSession';
import { IClientSocket } from '../ClientSocket';
import Delegate from '../Delegate';
import { ClientMessage, ServerMessage } from '../messages';

export default class MockSocket implements IClientSocket {
  clientId: string;
  onMessage = new Delegate<ClientMessage>();
  onClose = new Delegate<null>();

  sentMessages: ServerMessage[] = [];

  constructor() {
    this.clientId = 'clientId';
  }

  send(msg: ServerMessage) {
    this.sentMessages.push(msg);
  }

  close() {
    this.onClose.call(null);
  }
}

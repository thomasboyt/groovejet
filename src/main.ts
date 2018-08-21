import * as ws from 'ws';
import * as http from 'http';

import ClientSocket from './ClientSocket';
import ClientSession from './ClientSession';

const server = http.createServer();
const wss = new ws.Server({ server });

wss.on('connection', (ws, req) => {
  const socket = new ClientSocket(ws);
  const session = new ClientSession(socket);
  session.sendIdentity();
});

/*
 * Run server
 */

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Lobby server listening on port ${port}!`);
});

import * as express from 'express';
import * as ws from 'ws';
import * as http from 'http';
import * as cors from 'cors';
import * as url from 'url';
import * as uuidv4 from 'uuid/v4';

import Room from './Room';
import {
  MissingRoomCodeErrorMessage,
  NoRoomFoundErrorMessage,
  SIdentityMessage,
} from './messages';

// magical singleton state here~
const rooms = new Map<string, Room>();

const server = http.createServer();

const app = express();
app.use(express.json());
app.use(cors()); // TODO: only whitelist app server

function generateCode(length: number): string {
  // https://stackoverflow.com/a/19964557
  return (Math.random().toString(36) + '00000000000000000').slice(
    2,
    length + 2
  );
}

app.post('/rooms', (req, res) => {
  // create game code
  // (TODO: check uniqueness lol)
  const code = generateCode(5);
  rooms.set(code, new Room());
  res.json({ code });
});

const wss = new ws.Server({ server });

wss.on('connection', (ws, req) => {
  const query = url.parse(req.url!, true).query;

  if (typeof query.code !== 'string') {
    const msg: MissingRoomCodeErrorMessage = {
      type: 'error',
      errorType: 'missingRoomCode',
      errorMessage: 'Missing room code in query string',
    };

    ws.send(JSON.stringify(msg));
    return ws.close();
  } else if (!rooms.has(query.code)) {
    const msg: NoRoomFoundErrorMessage = {
      type: 'error',
      errorType: 'noRoomFound',
      errorMessage: `No room exists with code ${query.code}`,
    };

    ws.send(JSON.stringify(msg));
    return ws.close();
  }

  const clientId = uuidv4();

  const msg: SIdentityMessage = {
    type: 'identity',
    data: {
      clientId,
    },
  };

  ws.send(JSON.stringify(msg));

  const room = rooms.get(query.code)!;

  if (typeof query.host === 'string') {
    room.registerHost(ws);
  } else {
    room.registerGuest(ws, clientId);
  }
});

/*
 * Run server
 */

const port = process.env.PORT || 3000;

server.on('request', app);

server.listen(port, () => {
  console.log(`Lobby server listening on port ${port}!`);
});

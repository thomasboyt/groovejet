import * as express from 'express';
import * as ws from 'ws';
import * as http from 'http';
import * as cors from 'cors';
import * as url from 'url';

import Room from './Room';

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
    ws.send(
      JSON.stringify({
        error: `Missing room code in query string`,
      })
    );

    return ws.close();
  } else if (!rooms.has(query.code)) {
    ws.send(
      JSON.stringify({
        error: `No room exists with code ${query.code}`,
      })
    );

    return ws.close();
  }

  const room = rooms.get(query.code)!;

  if (typeof query.host === 'string') {
    room.registerHost(ws);
  } else {
    room.registerClient(ws);
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

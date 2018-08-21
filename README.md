# groovejet

a webrtc lobby server for connecting players to each other

## overall goals

* [x] allow clients to establish p2p connections to a host
* [x] provide host and clients unique identifying tokens allowing reconnections between peers or to the lobby server to happen without losing your identity
* [ ] allow the host to be migrated to a client
* [ ] save snapshots of game state to lobby server so game can be resumed even if everyone crashes out/loses connection

## current todo

* [x] support multiple clients connecting
* [ ] write tests lol
    * oh god how do i mock websockets tho
* [ ] don't crash when weird things happen
* [ ] allow host to reconnect (assuming p2p session still active/host did not lose state)
* [ ] delete room when host disconnects + timeout

## terminology

- *server* - the groovejet server
- *client* - any connection to the groovejet server
- *host* - the host of a given room
- *guest* - p2p clients of a room's host
- *client ID* - UUID generated for each client. can be used by games to identify players. eventually will be made persistent in some way to allow client reconnections

within pearl, "client" is generally used instead of "guest," since there's less ambiguity to the term (as connections within pearl are referred to as _peer_ connections, not client connections).

## usage

### room connection

client connects to the websocket and receives an identity message:

```js
{
  type: 'identity',
  data: {
    clientId: 'xxxx-xxxx-xxxx'
  }
}
```

client sends a `joinRoom` or `createRoom` to connect to a room or create a room:

```js
{
  type: 'joinRoom',
  data: {
    roomCode: 'abcde'
    // indicates whether this client can take over as room host if the room
    // host has disconnected
    canHost: false,
  }
}

// or

{
  type: 'createRoom'
}
```

for joins, server sends back a response indicating their role in the room (this allows for host reconnection):

```js
{
  type:  'roomJoined',
  data: {
    // sent so client can determine whether to go into host or guest mode
    isHost: false,
    // sent so client can perform special reconnection logic instead of normal
    // connection logic
    // [not yet implemented]
    // reconnected: false,
  }
}
```

for room creation, the server just sends back a response with the new room code:

```js
{
  type: 'roomCreated',
  data: {
    roomCode: 'abcde'
  }
}
```

if the client is the room host, their socket will be registered as a host and they'll receive incoming guest offers. if they're a guest, the client should send an offer immediately, as described above.

#### room connection errors

* `missingRoomCode` - no room code passed in the query string.
* `noRoomFound` - no room found with the passed room code.
* `hostDisconnected` - sent to a client that cannot act as host when they attempt to join a room that has no host connected

### signaling

once connection is established, guest sends a signal offer

```js
{
  type: 'guestOfferSignal',
  data: {
    offerSignal: '<offer signal>',
  },
}
```

host receives

```js
{
  type: 'guestOfferSignal',
  data: {
    offerSignal: '<offer signal>',
    clientId: '<uuid>',
  }
}
```

and replies with an answer signal and the received client ID

```js
{
  type: 'hostAnswerSignal',
  data: {
    answerSignal: '<answer signal>',
    clientId: '<uuid>',
  },
}
```

guest receives

```js
{
  type: 'hostAnswerSignal',
  data: {
    answerSignal: '<answer signal>',
  },
}
```

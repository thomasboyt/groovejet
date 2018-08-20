## groovejet

a webrtc lobby server for connecting players to each other

### overall goals

* [x] allow clients to establish p2p connections to a host
* [x] provide host and clients unique identifying tokens allowing reconnections between peers or to the lobby server to happen without losing your identity
* [ ] allow the host to be migrated to a client
* [ ] save snapshots of game state to lobby server so game can be resumed even if everyone crashes out/loses connection

### current todo

* [x] support multiple clients connecting
* [ ] write tests lol
    * oh god how do i mock websockets tho
* [ ] don't crash when weird things happen
* [ ] allow host to reconnect (assuming p2p session still active/host did not lose state)
* [ ] delete room when host disconnects + timeout

### terminology

- *server* - the groovejet server
- *client* - any connection to the groovejet server
- *host* - the host of a given room
- *guest* - p2p clients of a room's host
- *client ID* - UUID generated for each client. can be used by games to identify players. eventually will be made persistent in some way to allow client reconnections

within pearl, "client" is generally used instead of "guest," since there's less ambiguity to the term (as connections within pearl are referred to as _peer_ connections, not client connections).

### current usage

host requests a room code with

```
POST /rooms
```

then initiates a websocket connection to

```
/?host=true&code=<code>
```

guest opens websocket connection to

```
/?code=<code>
```

then sends a signal offer

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

#### errors

* `missingRoomCode` - no room code passed in the query string.
* `noRoomFound` - no room found with the passed room code.
* `hostDisconnected` - sent to a guest when they attempt to join a room that has no host connected.
* `hostAlreadyExists` - a client tried to connect to a room as a host, but the room already has a host.

### future ideal usage

client connects to the websocket and receives an identity message:

```js
{
  type: 'identity',
  data: {
    clientId: 'xxxx-xxxx-xxxx'
  }
}
```

client attempts to connect to a room or create a room:

```js
{
  type: 'joinRoom',
  data: {
    roomCode: 'abcde'
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
    clientIsHost: false,
    // sent so client can perform special reconnection logic instead of normal
    // connection logic
    reconnected: false,
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

#### errors

* `missingRoomCode` - no room code passed in the query string.
* `noRoomFound` - no room found with the passed room code.
* `hostDisconnected` - sent to a guest when they attempt to join a room that has no host connected.
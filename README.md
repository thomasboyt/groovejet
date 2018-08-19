## groovejet

a webrtc lobby server for connecting players to each other

### overall goals

* [x] allow clients to establish p2p connections to a host
* [ ] provide host and clients unique identifying tokens allowing reconnections between peers or to the lobby server to happen without losing your identity
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

### usage

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
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

### usage

host requests a room code with

```
POST /rooms
```

then initiates a websocket connection to

```
/?host=true&code=<code>
```

client opens websocket connection to

```
/?code=<code>
```

then sends a signal offer

```js
{
  type: 'clientSignal',
  data: {
    offerSignal: '<offer signal>',
  },
}
```

host receives

```js
{
  type: 'clientConnection',
  data: {
    offerSignal: '<offer signal>',
    clientId: '<uuid>',
  }
}
```

and replies with an answer signal and the received client ID

```js
{
  type: 'hostSignal',
  data: {
    answerSignal: '<answer signal>',
    clientId: '<uuid>',
  },
}
```

client receives

```js
{
  type: 'hostSignal',
  data: {
    answerSignal: '<answer signal>',
  },
}
```
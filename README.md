## groovejet

a webrtc lobby server for connecting players to each other

### overall goals

* [ ] allow clients to establish p2p connections to a host
* [ ] allow the host to be migrated to a client
* [ ] save snapshots of game state to lobby server so game can be resumed even if everyone crashes out/loses connection

### current todo

* [ ] don't crash when weird things happen
* [ ] support multiple clients connecting
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
    // TODO: used to disambiguate multiple connecting clients
    clientId: '<uuid>',
  }
}
```

and replies with an answer signal

```js
{
  type: 'hostSignal',
  data: {
    answerSignal: '<answer signal>',
    // TODO
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
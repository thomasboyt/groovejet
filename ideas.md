### joining state

<-- identity message

--> join/create request

<-- join/create response
  | join error: kill socket

### in-room state

--> client offer
| |
| |
<-- host answer

eventually: trickle msgs here

- host migration
  - this is going to be complex... actual migration kind of needs to happen on clients, yea? like when the webrtc socket dies...
  - otoh maybe makes sense on server because there's no way for a client to authoritatively say "hey i lost connection to host so that means migration needs to happen, yeah??"
  - so, if migration happens on groovejet d/c, server needs to send an message to a client saying "you're in charge now!"
    - also needs to send message to other clients saying "host connection was lost, please wait..."
  - client should send back a message saying "okay i'm all set up, make me host and tell other clients that i'm the host"
  - server sends messages to each client saying signaling is ready
    - re-signal

- host disconnected
  - this is the _prelude_ to host migration, and will probably stick  around once migration exists, to add a reconnection grace period, or just as an option for games that don't want to support host migration
  - clients should be notified that host disconnected from groovejet, but probably won't actually do anything with that?
    - in practice clients should pause game state once a disconnection from _peers_ is detected, dunno what that looks like yet
  - anyways send a "host disconnected" event on disconnection
  - if host rejoins, send a "host rejoined" message that triggers re-signaling
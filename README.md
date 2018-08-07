# BrooklynJS Pong

This repo contains the _complete_ code for the WebRTC Pong demo I showcased in my BrooklynJS talk. Some of the code in this codebase is also available as individual NPM modules, but I went ahead and vendored it here so that you can see all of the moving parts.

## Overview

### server/

This is the NodeJS signaling server used to establish peer-to-peer connections.

### client/sockets

These modules contain the code that handles peer-to-peer connections (`PeerSocket`) as well as the signaling server (`SignalingSocket`).

I've used the too-generic name "socket" here because I'm bad at naming things, but basically, these socket classes are responsible for establishing connections and emitting events the game code can listen to.

The `ClientSession` and `HostSession` classes are what the game code actually uses for this, and try to hide the details of the connection as much as possible. Note that the `HostSession` has the ability to handle _1:n_ connections, for games that support more than just two players. In fact, this demo even supports additional clients joining as "spectators" to show off this ability.

### client/

The rest of client is, of course, the game code. I tried to make it as easy to follow as possible.

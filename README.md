# BrooklynJS Pong

This repo contains the _complete_ code for the WebRTC Pong demo I showcased in my BrooklynJS talk. Some of the code in this codebase is also available as individual NPM modules, but I went ahead and vendored it here so that you can see all of the moving parts.

## Overview

### server/

This is the NodeJS signaling server used to establish peer-to-peer connections. This is based on a signaling server I'm working on called [Groovejet](https://github.com/thomasboyt/groovejet), which I've been using in my WebRTC games.

### client/sockets

These modules contain the code that handles peer-to-peer connections (`PeerSocket`) as well as the signaling server (`SignalingClient`). This code is based on code I'm using in a networking library for [Pearl](https://disco.zone/pearl/), an extremely work-in-progress TypeScript game framework.

`SignalingClient` is a wrapper around a WebSocket connection to the signaling server. It's pretty thin and only used for sending and receiving offer and answer tokens.

`PeerSocket` is a wrapper around a WebRTC connection. It establishes two WebRTC data channels: one reliable (TCP-like) and one unreliable (UDP-like). It also has methods for creating offer and answer tokens, and logic for nicely cleaning up connections when they close or error (e.g. when a browser tab is closed).

The `ClientSession` and `HostSession` classes are interfaces that encapsulate both of these connections, and are the public API that actually gets used by game code. `ClientSession` simply handles establishing one peer connection to a host, while `HostSession` handles _1:n_ peer connections, for games that support more than just two players. In fact, this demo even supports additional clients joining as "spectators" to show off this ability.

### client/

The rest of client is, of course, the game code. I tried to make it as easy to follow as possible.

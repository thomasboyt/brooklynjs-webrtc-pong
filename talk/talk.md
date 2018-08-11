class: middle, center

# Building a peer-to-peer video game with WebRTC!

### Thomas Boyt &middot; BrooklynJS August 2018

---

# WebRTC Recap

* _Peer to peer_ communication _between browsers_
* Created for, and generally still associated with, videoconferencing
* Apps that use WebRTC: Slack, Discord
* Almost available in all browsers, with some major caveats
  * Safari - prerelease
  * Edge - no data support yet :(

???

* Quick show of hands, how many people here have heard of WebRTC?
* Peer to peer = without server

---

# WebRTC for Games!

* WebRTC has an `RTCDataChannel` API with a similar interface to WebSockets
* Can create _unreliable_, UDP-like channels with higher performance
* One player can act as a "host" that all other players connect to

---

# Actually Connecting Two Browsers

* WebRTC connections are really complicated!
* Turns out, connecting two peers is kinda tricky on modern networks
* WebRTC leaves developer responsible for handling a lot of complex implementation details

---

### There Are a Whole Bunch of Acronyms and IETF RFCs, All of Which We'll Ignore But You Can Read About If You Want

* Session Traversal Utilities for NAT (stun)
* Traversal Using Relays around NAT (turn)
* Interactive Connectivity Establishment (ice)
* Session Description Protocol (sdp)
* Stream Control Transmission Protocol (sctp)

???

So, when I was learning how this whole process worked, I had to learn how, like, eighteen different protocols and systems I'd never heard of worked, and I had to read a bunch of IETF RFCs. If you haven't read an IETF RFC, they're the documents that basically say "here's how this part of the internet is supposed to work," and they basically have about the same level of formatting as this slide deck.

---

class: center, middle

# Signaling 101

Or: "How does Browser A tell Browser B it wants to connect"?

???

Instead, I'm going to try to give a brief overview of how browsers connect, without all the scary acronyms, and avoiding a lot of complex but common edge cases. This isn't complete but should give you a basic picture.

The public part of the process by which peers figure out how to connect to each other is called _signaling_, which is more or less passing messages back and forth between the peers through a developer-implemented signaling channel.

---

# Signaling Tokens

* WebRTC generates signaling *tokens*, big strings of text that say:
  * Here's my public IP you can connect to
  * Here's the video and audio codecs you could use
* Lists multiple IPs so e.g. intranet connections use a local IP (192.168.x.x)
* One end generates an _offer_ token, the other end takes that token and generates an _answer_ token and sends it back

---

# Sending/Receiving Tokens

* This could literally just be copy-pasting a giant blob of text between two browsers, or like sending it to your friend over ~~AIM~~ ~~Yahoo~~ ~~MSN~~ WhatsApp or whatever the kids use these days

---

# Sending/Receiving Tokens

* In most use cases: something like a central WebSockets server!
  * WebSockets instead of just plain HTTP allows for some more complex signaling scenarios we won't get into
* For video games: think of signaling server like a "lobby" server. You tell the signaling server "I want to connect to this 'room'," it sends back the host player's token for that room

---

# Using Data Channels

* Once offer/answers are exchanged and peers successfully connect, create data channel(s)
* Similar interface to WebSockets
* Create on the offering client _before_ sending offer, since they're included in the offer token!

---

# Using Data Channels

* Can be created with options that disable TCP guarantees common to HTTP/WebSockets
  * `maxRetransmits: 0` - don't try to resend packets
  * `ordering: false` - don't enforce the order messages are received (prevent head-of-line blocking)
* Can create more than one channel per connection (e.g. one reliable and one unreliable)

---

# Example: Sending Offer

```js
import signalingServerSession from './signalingServerSession';

const peer = new RTCPeerConnection({/* ... */});

async function createAndSendOffer() {
  const offer = await peer.createOffer();
  peer.setLocalDescription(offer);

  // gather candidate addresses...
  peer.onicecandidate = (evt) => {
    if (evt.candidate) {
      // still gathering
    } else {
      gotCandidates();
    }
  };

  function gotCandidates() {
    // the offer has now been updated with candidates, so
    // send offer to signaling server
    signalingServerSession.sendOffer(peer.localDescription);
  }
}
```

---

# Example: Handling Offer

```js
const peer = new RTCPeerConnection({/* ... */});

signalingServerSession.on('receivedOffer', async (offer) => {
  await peer.setRemoteDescription(offer);

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  // gather candidate addresses...
  peer.onicecandidate = (evt) => {
    if (!evt.candidate) {
      // no candidate in the event means we're done gathering
      gotCandidates();
    }
  };

  function gotCandidates() {
    signalingServerSession.sendAnswer(peer.localDescription);
  }
});
```

---

# Example: Handling Answer

```js
signalingServerSession.on('receivedAnswer', async (answer) => {
  peer.setRemoteDescription(answer);
});
```

---

# Example: Data Channel

```js
// on offering end, BEFORE creating offer:
const peer = new RTCPeerConnection({/* ... */});

const channel = peer.createDataChannel('my-channel');

channel.onopen = () => {/* ... */};
channel.onclose = () => {/* ... */};
channel.onmessage = (evt) => { console.log(evt.data); };
```

```js
// on answering end:
const peer = new RTCPeerConnection({/* ... */});

peer.ondatachannel = (evt) => {
  const channel = evt.channel;
  channel.onopen = () => {/* ... */};
  channel.onclose = () => {/* ... */};
  channel.onmessage = (evt) => { console.log(evt.data); };
};
```

---

class: center, middle

# [Pong Demo!](https://disco.zone/pong/)

???

* Have shortlink to already-set-up https://disco.zone/pong/?roomCode=XXXXX
* Encourage ppl to join as spectator

---

# Code & Wrap-up

* https://github.com/thomasboyt/brooklynjs-webrtc-pong
  * Includes signaling server, client networking, and game code
* Lots and lots of stuff couldn't be covered in this talk, but you should read the free [_High Performance Browser Networking_](https://hpbn.co/) book for details!
  * Chapter 3 (UDP, STUN, TURN, etc.) & Chapter 18 (WebRTC)

---

# Code & Wrap-up

* Thank you!!
* Btw, I'm looking for a job! Check out my ~~soundcloud~~ resumé at https://thomasboyt.com
* I also made some games you can play or read about at https://disco.zone
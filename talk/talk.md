class: middle, center

# Building a peer-to-peer video game with WebRTC!

### .title-slide-subhead[Thomas Boyt &middot; BrooklynJS August 2018 <br> [disco.zone/webrtc-talk](https://disco.zone/webrtc-talk)]


???

* Hit P for presentation mode (this)
* Hit C to create new window
* Hit T to reset timer when starting

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
* Peer to peer = without intermediary server

---

# WebRTC for Games?

* Peer to peer games are very common!
  * Everything from Call of Duty to Diablo
  * One player acts as a "host" that all other players connect to
  * Great for small player counts
* Can create _unreliable_, UDP-like connections with higher performance

---

# WebRTC for Games!

* WebRTC has an `RTCDataChannel` API we can use with a similar interface to WebSockets
* Send arbitrary data between peers
* Supports strings or binary data (`Blob` or `ArrayBuffer`)

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

So, when I was learning how this whole process worked, I had to learn how, like, eighteen different protocols and systems I'd never heard of worked, and I wound up actually digging into IETF RFCs to understand some of them.

---

class: center, middle

# Signaling 101

Or: "How does Browser A tell Browser B it wants to connect"?

???

Instead of explaining all of the various moving parts, I'm going to try to give a brief overview of how WebRTC peers connect, without all the scary acronyms, and avoiding a lot of complex but common edge cases. This isn't complete but should give you a basic picture.

The public part of the process by which peers figure out how to connect to each other is called _signaling_, which is more or less passing messages back and forth between the peers through a developer-implemented signaling channel.

---

# Signaling Tokens

* WebRTC generates signaling *tokens*, big strings of text that say:
  * Here's my public IP you can connect to
  * Here's the video and audio codecs you could use
* Lists multiple _candidate_ IPs so e.g. intranet connections use a local IP (192.168.x.x)
* One end generates an _offer_ token, the other end takes that token and generates an _answer_ token and sends it back

---

# Sending/Receiving Tokens

* This could literally just be copy-pasting a giant blob of text between two browsers, or like sending it to your friend over ~~AIM~~ ~~Yahoo~~ ~~MSN~~ WhatsApp or whatever the kids use these days

---

# Sending/Receiving Tokens

* In most use cases: something like a central WebSockets server!
  * WebSockets instead of just plain HTTP allows for some more complex signaling scenarios we won't get into
* For video games: think of signaling server like a "lobby" server
* A connecting client tells the signaling server "I want to connect to this 'room'," and sends an offer, and receives back the room host's answer token

---

# Example: Sending Offer

```js
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

# Using Data Channels

* When offer/answers are exchanged and peers successfully connect, you can use one or more data channels to communicate
* Similar interface to WebSockets
* Create on the offering client _before_ sending offer, since they're included in the offer token!
  * (if you really want to you can create the channel afterwards and re-negotiate the offer but it's a pain)

---

# Using Data Channels

* Can be created with options that disable TCP guarantees common to HTTP/WebSockets
  * `maxRetransmits: 0` - don't try to resend packets
  * `ordering: false` - don't enforce the order messages are received (prevent head-of-line blocking)
* Can create more than one channel per connection (e.g. one reliable and one unreliable)

---

# Example: Data Channel

```js
// on offering end, BEFORE creating offer:
const peer = new RTCPeerConnection({/* ... */});

const channel = peer.createDataChannel('my-channel', {
  maxRetransmits: 0,
  ordering: false,
});

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
* Describe how networking code works
  * Host data as just a simple snapshot to client
  * Client sends messages telling host it's moving the paddle by some distance

---

# Code & Wrap-up

* These slides: https://disco.zone/webrtc-talk
* Code: https://github.com/thomasboyt/brooklynjs-webrtc-pong
  * Includes signaling server, client networking, and game code
* Lots and lots of stuff couldn't be covered in this talk, but you should read the free [_High Performance Browser Networking_](https://hpbn.co/) book for details!
  * Chapter 3 (UDP, STUN, TURN, etc.) & Chapter 18 (WebRTC)

---

# Code & Wrap-up

* If you're curious about my actual WebRTC game project: https://devlog.disco.zone/2018/08/01/sledgehammer/
* I also made some games you can play or read about at https://disco.zone
* Btw, I'm looking for a job! Check out my ~~soundcloud~~ resumé at https://thomasboyt.com
* Thank you!!
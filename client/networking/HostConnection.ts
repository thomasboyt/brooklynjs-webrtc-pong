import SignalingClient from './signaling/SignalingClient';
import PeerSocket from './PeerSocket';
import { createRoom } from './signaling/SignalingHTTP';
import debugLog from './util/debugLog';

type PeerId = string;

/**
 * A host connection multiplexes connections to various peers and can send and
 * receive messages to/from any of them.
 */
export default class HostConnection {
  private _signaling!: SignalingClient;
  private _peerSockets = new Map<PeerId, PeerSocket>();
  private _signalingServerUrl: string;

  onPeerOpen = (id: PeerId) => {};
  onPeerClose = (id: PeerId) => {};
  onPeerMessage = (id: PeerId, msg: any) => {};
  onSignalingOpen = () => {};

  constructor(signalingServerUrl: string) {
    this._signalingServerUrl = signalingServerUrl;
  }

  async getRoomCode(): Promise<string> {
    const code = await createRoom(this._signalingServerUrl);
    return code;
  }

  connectRoom(roomCode: string) {
    this._signaling = new SignalingClient({
      isHost: true,
      url: this._signalingServerUrl,
      roomCode,

      onOpen: () => {
        this.onSignalingOpen();
      },

      onClientOfferSignal: (clientId, offer) => {
        this._onClientOffer(clientId, offer);
      },
    });
  }

  private async _onClientOffer(
    peerId: PeerId,
    offer: RTCSessionDescriptionInit
  ) {
    debugLog('* host: creating peer & answer');

    const peer = new PeerSocket({
      onOpen: () => {
        this.onPeerOpen(peerId);
      },
      onMessage: (evt) => {
        this.onPeerMessage(peerId, evt.data);
      },
      onClose: () => {
        this.onPeerClose(peerId);
      },
    });

    this._peerSockets.set(peerId, peer);

    const answer = await peer.handleOffer(offer);
    this._signaling.sendHostAnswerSignal(peerId, answer);

    debugLog('* host: sent host answer');
  }

  sendPeer(
    id: PeerId,
    msg: any,
    channelLabel: 'reliable' | 'unreliable' = 'reliable'
  ) {
    const socket = this._peerSockets.get(id);
    if (!socket) {
      throw new Error(`cannot send message to nonexistent peer ${id}`);
    }

    socket.send(channelLabel, msg);
  }

  closePeerConnection(id: PeerId) {
    const socket = this._peerSockets.get(id);
    if (!socket) {
      throw new Error(`cannot close socket for nonexistent peer ${id}`);
    }
    socket.close();
    this._peerSockets.delete(id);
  }
}

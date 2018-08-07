import SignalingClient from './signaling/SignalingClient';
import PeerSocket from './PeerSocket';
import debugLog from './util/debugLog';

export default class ClientConnection {
  private _signaling!: SignalingClient;
  private _hostSocket!: PeerSocket;
  private _signalingServerUrl: string;

  lobbyConnectionState: 'connecting' | 'open' | 'closed' = 'connecting';
  hostConnectionState: 'init' | 'connecting' | 'open' | 'closed' = 'init';

  onOpen = () => {};
  onClose = () => {};
  onMessage = (msg: any) => {};

  constructor(signalingServerUrl: string) {
    this._signalingServerUrl = signalingServerUrl;
  }

  connectRoom(roomCode: string) {
    this._signaling = new SignalingClient({
      isHost: false,
      url: this._signalingServerUrl,
      roomCode,

      onOpen: () => {
        this._onSignalingOpen();
      },

      onHostAnswerSignal: (answer) => {
        this._onHostAnswer(answer);
      },
    });
  }

  private async _onSignalingOpen() {
    debugLog('* client: signaling server connection open');
    this.lobbyConnectionState = 'open';
    this.hostConnectionState = 'connecting';

    this._hostSocket = new PeerSocket({
      onOpen: () => {
        this.hostConnectionState = 'open';
        this.onOpen();
      },
      onMessage: (evt) => {
        this.onMessage(evt.data);
      },
      onClose: () => {
        this.hostConnectionState = 'closed';
        this.onClose();
      },
    });

    const offer = await this._hostSocket.createOffer();
    this._signaling.sendClientOfferSignal(offer);
    debugLog('* client: sent client offer signal');
  }

  private async _onHostAnswer(answer: RTCSessionDescriptionInit) {
    debugLog('* client: received answer');
    await this._hostSocket.handleAnswer(answer);
    debugLog('* client: handled answer');
  }

  send(msg: any, channelLabel: 'unreliable' | 'reliable' = 'reliable'): void {
    this._hostSocket.send(channelLabel, msg);
  }
}

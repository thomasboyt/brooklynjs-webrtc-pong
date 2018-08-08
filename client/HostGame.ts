import HostSession from './networking/HostSession';
import { ClientMessage, SnapshotMessage } from './messages';
import { HostState } from './state';
import { HEIGHT, WIDTH } from './constants';
import Inputter from './util/Inputter';
import Keys from './util/Keys';

export default class HostGame {
  inputter = new Inputter();

  state: HostState = {
    hostPaddlePosition: [20, HEIGHT / 2],
    ballSpeed: 0,
    ballPosition: [WIDTH / 2, HEIGHT / 2],
    ballVector: [0, 0],
  };

  session: HostSession;
  opponentPeerId!: string;
  clientIds = new Set<string>();

  constructor(session: HostSession) {
    this.inputter.registerLocalListeners();

    this.session = session;

    this.session.onPeerOpen = (peerId) => {
      this.clientIds.add(peerId);
      if (!this.opponentPeerId) {
        this.opponentPeerId = peerId;
        this.state.opponentPaddlePosition = [WIDTH - 20, HEIGHT / 2];
      }
    };

    this.session.onPeerMessage = (peerId, message) => {
      if (peerId === this.opponentPeerId) {
        const msg = JSON.parse(message) as ClientMessage;
        if (msg.type === 'move') {
          this.state.opponentPaddlePosition![1] += msg.deltaY;
        }
      }
    };

    this.session.onPeerClose = (peerId) => {
      this.clientIds.delete(peerId);
      if (peerId === this.opponentPeerId) {
        delete this.state.opponentPaddlePosition;
        delete this.opponentPeerId;
      }
    };
  }

  update(dt: number) {
    // 1. read local input and move paddle
    const step = dt * 0.1;
    if (this.inputter.keysDown.has(Keys.upArrow)) {
      this.state.hostPaddlePosition[1] -= step;
    }
    if (this.inputter.keysDown.has(Keys.downArrow)) {
      this.state.hostPaddlePosition[1] += step;
    }

    // 2. move ball
    const [ballX, ballY] = this.state.ballPosition;
    this.state.ballPosition = [
      ballX + this.state.ballVector[0] * this.state.ballSpeed * dt,
      ballY + this.state.ballVector[1] * this.state.ballSpeed * dt,
    ];

    // 3. collision resolution

    // 4. send snapshot
    this.sendSnapshot();
  }

  sendSnapshot() {
    const snapshot: SnapshotMessage = {
      type: 'snapshot',
      state: this.state,
    };

    for (let peerId of this.clientIds) {
      this.session.sendPeer(peerId, JSON.stringify(snapshot), 'unreliable');
    }
  }
}

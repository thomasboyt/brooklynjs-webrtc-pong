import HostSession from './networking/HostSession';
import { ClientMessage, SnapshotMessage } from './messages';
import { HostState } from './state';
import {
  HEIGHT,
  WIDTH,
  BALL_RADIUS,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
} from './constants';

import Inputter from './util/Inputter';
import Keys from './util/Keys';
import { Vector2 } from './util/vectorMaths';
import * as V from './util/vectorMaths';
import aabbTest from './util/aabbTest';

export default class HostGame {
  inputter = new Inputter();

  state: HostState = {
    hostPaddlePosition: { x: 20, y: HEIGHT / 2 },
    ballSpeed: 0,
    ballPosition: { x: WIDTH / 2, y: HEIGHT / 2 },
    ballVector: { x: 0, y: 0 },
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
        this.state.opponentPaddlePosition = { x: WIDTH - 20, y: HEIGHT / 2 };
        this.startBallMoving();
      }
    };

    this.session.onPeerMessage = (peerId, message) => {
      if (peerId === this.opponentPeerId) {
        const msg = JSON.parse(message) as ClientMessage;
        if (msg.type === 'move') {
          this.state.opponentPaddlePosition!.y += msg.deltaY;
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
    // read local input and move paddle
    const step = dt * 0.1;
    if (this.inputter.keysDown.has(Keys.upArrow)) {
      this.state.hostPaddlePosition.y -= step;
    }
    if (this.inputter.keysDown.has(Keys.downArrow)) {
      this.state.hostPaddlePosition.y += step;
    }

    // collision resolution
    this.moveBallAndCheckCollisions(dt);
    this.checkBallOffscreen();

    // 4. send snapshot
    this.sendSnapshot();
  }

  private startBallMoving() {
    this.state.ballPosition = { x: WIDTH / 2, y: HEIGHT / 2 };
    this.state.ballSpeed = 0.1;
    const startingX = Math.random() > 0.5 ? 1 : -1;
    this.state.ballVector = { x: startingX, y: 0 };
  }

  private moveBallAndCheckCollisions(dt: number) {
    let newPosition = V.add(
      this.state.ballPosition,
      V.multiply(this.state.ballVector, this.state.ballSpeed * dt)
    );

    const ballRect = {
      x: newPosition.x - BALL_RADIUS,
      y: newPosition.y - BALL_RADIUS,
      w: BALL_RADIUS * 2,
      h: BALL_RADIUS * 2,
    };

    const hostPaddleRect = {
      x: this.state.hostPaddlePosition.x - PADDLE_WIDTH / 2,
      y: this.state.hostPaddlePosition.y - PADDLE_HEIGHT / 2,
      w: PADDLE_WIDTH,
      h: PADDLE_HEIGHT,
    };

    const paddles = [
      this.state.hostPaddlePosition,
      this.state.opponentPaddlePosition,
    ].map(
      (pos) =>
        pos && {
          pos,
          x: pos.x - PADDLE_WIDTH / 2,
          y: pos.y - PADDLE_HEIGHT / 2,
          w: PADDLE_WIDTH,
          h: PADDLE_HEIGHT,
        }
    );

    for (let paddleRect of paddles) {
      if (!paddleRect) {
        continue;
      }

      if (aabbTest(ballRect, paddleRect)) {
        // first revert to old position
        newPosition = this.state.ballPosition;

        // then set new movement vector to bounce back...
        const vec = V.subtract(this.state.ballPosition, paddleRect.pos);
        this.state.ballVector = V.unit(vec);

        // and increase speed
        this.state.ballSpeed += 0.02;
      }
    }

    // reflect off top/bottom edges of screen
    if (ballRect.y < 0) {
      this.state.ballVector = V.reflect(this.state.ballVector, { x: 0, y: 1 });
    } else if (ballRect.y + ballRect.h > HEIGHT) {
      this.state.ballVector = V.reflect(this.state.ballVector, { x: 0, y: -1 });
    }

    this.state.ballPosition = newPosition;
  }

  // check if ball is offscreen and reset if so
  private checkBallOffscreen() {
    const leftX = this.state.ballPosition.x - BALL_RADIUS;
    const rightX = this.state.ballPosition.x + BALL_RADIUS;

    if (rightX < 0 || leftX > WIDTH) {
      this.startBallMoving();
    }
  }

  private sendSnapshot() {
    const snapshot: SnapshotMessage = {
      type: 'snapshot',
      state: this.state,
    };

    for (let peerId of this.clientIds) {
      this.session.sendPeer(peerId, JSON.stringify(snapshot), 'unreliable');
    }
  }
}

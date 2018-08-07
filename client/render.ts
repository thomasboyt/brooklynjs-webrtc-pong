import { BaseState } from './state';
import {
  WIDTH,
  HEIGHT,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  BALL_RADIUS,
} from './constants';

export default function render(
  ctx: CanvasRenderingContext2D,
  state: BaseState
) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const drawPaddle = ([x, y]: [number, number]) => {
    ctx.fillStyle = 'white';
    ctx.fillRect(
      x - PADDLE_WIDTH / 2,
      y - PADDLE_HEIGHT / 2,
      PADDLE_WIDTH,
      PADDLE_HEIGHT
    );
  };

  const drawBall = ([x, y]: [number, number]) => {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  };

  drawPaddle(state.hostPaddlePosition);
  if (state.opponentPaddlePosition) {
    drawPaddle(state.opponentPaddlePosition);
  }

  drawBall(state.ballPosition);
}

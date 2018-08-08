import { Vector2 } from './util/vectorMaths';

export interface BaseState {
  hostPaddlePosition: Vector2;
  opponentPaddlePosition?: Vector2;
  ballPosition: Vector2;
}

export interface HostState extends BaseState {
  ballSpeed: number;
  ballVector: Vector2;
}

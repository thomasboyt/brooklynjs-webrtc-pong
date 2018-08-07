export interface BaseState {
  hostPaddlePosition: [number, number];
  opponentPaddlePosition?: [number, number];
  ballPosition: [number, number];
}

export interface HostState extends BaseState {
  ballSpeed: number;
  ballVector: [number, number];
}

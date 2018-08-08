import { BaseState } from './state';

export interface BaseMessage {
  type: string;
}

export interface SnapshotMessage extends BaseMessage {
  type: 'snapshot';
  state: BaseState;
}

export interface MoveMessage extends BaseMessage {
  type: 'move';
  deltaY: number;
}

export type HostMessage = SnapshotMessage;

export type ClientMessage = MoveMessage;

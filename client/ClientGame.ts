import { ClientMessage, HostMessage, MoveMessage } from './messages';
import { BaseState } from './state';
import Inputter from './util/Inputter';
import Keys from './util/Keys';
import ClientSession from './networking/ClientSession';

export default class ClientGame {
  inputter = new Inputter();
  state?: BaseState;
  session: ClientSession;
  opponentPeerId!: string;

  constructor(session: ClientSession) {
    this.inputter.registerLocalListeners();

    this.session = session;

    this.session.onOpen = () => {
      // connected but waiting for first snapshot
    };

    this.session.onMessage = (message) => {
      const msg = JSON.parse(message) as HostMessage;
      if (msg.type === 'snapshot') {
        this.state = { ...msg.state };
      }
    };

    this.session.onClose = () => {
      // TODO
    };
  }

  sendMoveUpdate(deltaY: number) {
    const msg: MoveMessage = {
      type: 'move',
      deltaY,
    };

    this.session.send(JSON.stringify(msg));
  }

  update(dt: number) {
    if (!this.state) {
      // waiting for snapshot...
      return;
    }

    // read local input and move paddle
    const step = dt * 0.1;
    if (this.inputter.keysDown.has(Keys.upArrow)) {
      this.sendMoveUpdate(-step);
    }
    if (this.inputter.keysDown.has(Keys.downArrow)) {
      this.sendMoveUpdate(step);
    }
  }
}

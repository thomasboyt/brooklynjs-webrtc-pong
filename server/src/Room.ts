import * as ws from 'ws';
import * as uuidv4 from 'uuid/v4';

export default class Room {
  hostWebSocket?: ws;
  clientWebSockets = new Map<string, ws>();
  clientIdCounter = 0;

  registerHost(socket: ws) {
    socket.on('message', (strMsg: string) => {
      const msg = JSON.parse(strMsg);
      this.handleHostMessage(msg);
    });

    const interval = setInterval(() => {
      socket.ping();
    }, 10000);

    socket.on('close', () => {
      this.hostWebSocket = undefined;
      clearInterval(interval);
    });

    this.hostWebSocket = socket;
  }

  registerClient(socket: ws) {
    const clientId = uuidv4();

    const interval = setInterval(() => {
      socket.ping();
    }, 10000);

    socket.on('message', (strMsg: string) => {
      const msg = JSON.parse(strMsg);
      this.handleClientMessage(clientId, msg);
    });

    socket.on('close', () => {
      // TODO
      // Allow reconnections and stuff
      this.clientWebSockets.delete(clientId);
      clearInterval(interval);
    });

    this.clientWebSockets.set(clientId, socket);
    this.clientIdCounter += 1;
  }

  sendToClient(clientId: string, data: {}) {
    const socket = this.clientWebSockets.get(clientId);

    if (!socket) {
      // TODO: properly handle disconnecting clients I guess
      return;
    }

    socket.send(JSON.stringify(data));
  }

  sendToHost(data: {}) {
    if (!this.hostWebSocket) {
      // TODO: ???
      return;
    }

    this.hostWebSocket.send(JSON.stringify(data));
  }

  handleClientMessage(clientId: string, msg: any) {
    if (msg.type === 'clientSignal') {
      this.sendToHost({
        type: 'clientConnection',
        data: {
          offerSignal: msg.data.offerSignal,
          clientId,
        },
      });
    }
  }

  handleHostMessage(msg: any) {
    if (msg.type === 'hostSignal') {
      const { answerSignal, clientId } = msg.data;

      this.sendToClient(clientId, {
        type: 'hostSignal',
        data: {
          answerSignal,
        },
      });
    }
  }
}

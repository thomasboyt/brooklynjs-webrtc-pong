import HostGame from './HostGame';
import HostSession from './networking/HostSession';
import Ticker from './util/Ticker';
import render from './render';

import { WIDTH, HEIGHT } from './constants';
import ClientSession from './networking/ClientSession';
import ClientGame from './ClientGame';
import setupCanvas from './util/setupCanvas';
import showRoomLink from './showRoomLink';

interface CreateGameOptions {
  isHost: boolean;
  roomCode?: string;
}

async function createGame(opts: CreateGameOptions) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = setupCanvas(canvas, WIDTH, HEIGHT);

  let game: HostGame | ClientGame;

  if (opts.isHost) {
    const session = new HostSession(process.env.LOBBY_SERVER!);
    const roomCode = await session.getRoomCode();
    showRoomLink(roomCode);
    session.connectRoom(roomCode);
    game = new HostGame(session);
  } else {
    const session = new ClientSession(process.env.LOBBY_SERVER!);
    await session.connectRoom(opts.roomCode!);
    game = new ClientGame(session);
  }

  const ticker = new Ticker((dt) => {
    game.update(dt);
    // TODO: show loading message
    if (game.state) {
      render(ctx, game.state);
    }
  });
}

const params = new URLSearchParams(document.location.search.slice(1));
const roomCode = params.get('roomCode');
if (roomCode !== null) {
  createGame({ isHost: false, roomCode });
} else {
  createGame({ isHost: true });
}

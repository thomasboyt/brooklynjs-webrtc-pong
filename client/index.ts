import HostGame from './HostGame';
import HostSession from './networking/HostSession';
import Ticker from './util/Ticker';
import render from './render';

import { WIDTH, HEIGHT } from './constants';
import ClientSession from './networking/ClientSession';
import ClientGame from './ClientGame';

function setupCanvas() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = WIDTH * pixelRatio;
  canvas.height = HEIGHT * pixelRatio;
  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${HEIGHT}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(pixelRatio, pixelRatio);
  return ctx;
}

function showRoomCode(roomCode: string) {
  const url =
    document.location.origin +
    document.location.pathname +
    `?roomCode=${roomCode}`;
  console.log('link', url);

  const roomLink = document.querySelector('a.room-link');
  if (roomLink instanceof HTMLAnchorElement) {
    roomLink.href = url;
    roomLink.innerText = url;
  }
}

interface CreateGameOptions {
  isHost: boolean;
  roomCode?: string;
}

async function createGame(opts: CreateGameOptions) {
  const ctx = setupCanvas();

  if (opts.isHost) {
    const session = new HostSession(process.env.LOBBY_SERVER!);
    const roomCode = await session.getRoomCode();
    showRoomCode(roomCode);
    session.connectRoom(roomCode);

    const game = new HostGame(session);
    const ticker = new Ticker((dt) => {
      game.update(dt);
      render(ctx, game.state);
    });
  } else {
    const session = new ClientSession(process.env.LOBBY_SERVER!);
    await session.connectRoom(opts.roomCode!);
    const game = new ClientGame(session);
    const ticker = new Ticker((dt) => {
      game.update(dt);
      // TODO: show loading message
      if (game.state) {
        render(ctx, game.state);
      }
    });
  }
}

const params = new URLSearchParams(document.location.search.slice(1));
const roomCode = params.get('roomCode');
if (roomCode !== null) {
  createGame({ isHost: false, roomCode });
} else {
  createGame({ isHost: true });
}

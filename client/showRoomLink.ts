export default function showRoomLink(roomCode: string) {
  const url =
    document.location.origin +
    document.location.pathname +
    `?roomCode=${roomCode}`;
  console.log('link', url);

  const roomLinkContainer = document.querySelector(
    '.room-link-container'
  ) as HTMLElement;
  roomLinkContainer!.style.display = 'block';

  const roomLink = document.querySelector('a.room-link');
  if (roomLink instanceof HTMLAnchorElement) {
    roomLink.href = url;
    roomLink.innerText = url;
  }
}

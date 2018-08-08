export default function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(pixelRatio, pixelRatio);
  return ctx;
}

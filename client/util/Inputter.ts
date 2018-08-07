import Keys from './Keys';

const interruptKeyCodes = new Set([
  Keys.leftArrow,
  Keys.rightArrow,
  Keys.upArrow,
  Keys.downArrow,
  Keys.space,
]);

export default class Inputter {
  keysDown = new Set<number>();

  registerLocalListeners() {
    window.addEventListener('keydown', (e) => {
      this.handleKeyDown(e.keyCode);

      if (interruptKeyCodes.has(e.keyCode)) {
        e.preventDefault();
        return false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.handleKeyUp(e.keyCode);
    });
  }

  private handleKeyDown(keyCode: number) {
    this.keysDown.add(keyCode);
  }

  private handleKeyUp(keyCode: number) {
    this.keysDown.delete(keyCode);
  }
}

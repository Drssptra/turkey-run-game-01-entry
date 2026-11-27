// input.js — keyboard and mouse, one place. The game reads this, never the
// DOM directly, so the self-test can drive the same handlers.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.canvas = canvas;
    this.onKey = null;
    this.onClick = null;

    window.addEventListener('keydown', (event) => {
      const code = event.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.pressed.add(code);
        if (this.onKey) this.onKey(code);
      }
      this.keys.add(code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mousedown', (event) => {
      this.mouse.down = true;
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
    });
    canvas.addEventListener('mouseup', () => {
      this.mouse.down = false;
      this.mouse.clicked = true;
      if (this.onClick) this.onClick(this.mouse.x, this.mouse.y);
    });
  }

  // True while the key is held down.
  down(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  // True only on the frame the key went down. Cleared by endFrame().
  hit(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  // True on the frame the mouse was released. Cleared by endFrame().
  click() {
    const clicked = this.mouse.clicked;
    return clicked;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }

  // Drive the game without a real keyboard (self-test / screenshot poses).
  fakeKey(code) {
    this.pressed.add(code);
    this.keys.add(code);
    if (this.onKey) this.onKey(code);
  }

  fakeKeyUp(code) {
    this.keys.delete(code);
  }
}

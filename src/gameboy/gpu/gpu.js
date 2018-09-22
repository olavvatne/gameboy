import Memory from '../memory/memory';
import VideoMemory from './video-memory';
import RenderTiming from './timing';
import FrameBuffer from './frame-buffer';
import Renderer from './renderer';
import Util from '../util';
import Interrupts from '../input/interrupts';

export default class GPU {
  constructor(screen, interrupts = new Interrupts()) {
    this.interrupts = interrupts;
    this.screen = screen;
    this.registers = {
      x: 0, y: 0, tileset: 0, tilemap: 0, bg: 0, sprite: 0,
    };
    this.palette = [
      [255, 255, 255, 255],
      [192, 192, 192, 255],
      [96, 96, 96, 255],
      [0, 0, 0, 255],
    ];
    this._frameBuffer = new FrameBuffer();
    this.renderTiming = new RenderTiming();
    this._vram = new VideoMemory(this._frameBuffer);
    this._oam = new Memory(2 ** 8); // TODO: create special memory that trigger actions on gpu
    this._renderer = new Renderer(
      this._frameBuffer, screen, this._vram,
      this.registers, this.palette,
    );
  }

  setPalette(value) {
    // 4 color palette. Each 2 bits in the byte decides palette color
    for (let i = 0; i < 4; i += 1) {
      const pal = Util.getHalfNibble(value, i);
      this.palette[pal] = Util.getPaletteColor(pal);
    }
  }

  removeImage() {
    this.screen.reset();
  }

  showImage() {
    // TODO: lcd, what does it do?
  }

  getVideoMemory() {
    return this._vram;
  }

  getAttributeTable() {
    return this._oam;
  }

  step(tick) {
    const result = this.renderTiming.step(tick);
    if (result.shouldScanline) this._renderer.renderScanline(this.renderTiming.getLine());
    if (result.lastHblank) {
      this._renderer.displayImage();
      this.interrupts._if |= 1;
    }
  }

  reset() {
    this.registers.x = 0;
    this.registers.y = 0;
    this.registers.tilemap = 0;
    this.registers.tileset = 0;
    this.registers.bg = 0;
    this.registers.sprite = 0;
    this.screen.reset();
  }
}

import OAM from './object-attribute-memory';
import VideoMemory from './video-memory';
import RenderTiming from './timing';
import FrameBuffer from './frame-buffer';
import Renderer from './renderer';
import Util from '../util';
import Interrupts from '../processor/interrupts';

/* eslint no-bitwise: 0 */

export default class GPU {
  constructor(screen, interrupts = new Interrupts()) {
    this.screen = screen;
    this.registers = {
      x: 0, y: 0, tileset: 0, tilemap: 0, bg: 0, sprite: 0, lcd: 1,
    };
    this.initPalette();
    this._frameBuffer = new FrameBuffer();
    this.renderTiming = new RenderTiming(interrupts);
    this._vram = new VideoMemory(this._frameBuffer);
    this._oam = new OAM();
    this._renderer = new Renderer(
      this._frameBuffer, this._oam, screen, this._vram,
      this.registers, this.palette,
    );
  }

  initPalette(palette = { bg: [], obj0: [], obj1: [] }) {
    this.palette = palette;
    this.setPalette(0b00011011, 'bg');
    this.setPalette(0b00011011, 'obj0');
    this.setPalette(0b00011011, 'obj1');
  }

  setPalette(value, type) {
    // 4 color palette. Each 2 bits in the byte decides palette color
    for (let i = 0; i < 4; i += 1) {
      const pal = Util.getHalfNibble(value, i);
      this.palette[type][i] = Util.getPaletteColor(pal);
    }
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
    if (result.shouldDisplay) {
      this._renderer.displayImage();
    }
  }

  reset() {
    this.registers.x = 0;
    this.registers.y = 0;
    this.registers.tilemap = 0;
    this.registers.tileset = 0;
    this.registers.bg = 0;
    this.registers.sprite = 0;
    this.initPalette(this.palette);
    this._oam.reset();
    this._frameBuffer.reset();
    this.renderTiming.reset();
    this.screen.reset();
  }
}

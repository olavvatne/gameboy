import Memory from '../memory/memory';
import RenderTiming from './timing';

export default class GPU {
  constructor(canvas) {
    this._canvas = canvas;
    this._vram = new Memory(2 ** 13); // TODO: create special memory that triggers actions on gpu
    this._oam = new Memory(2 ** 8); // TODO: create special memory that trigger actions on gpu
    this._framebuffer = { renderScanline: () => { }, getImage: () => { } }; // TODO: create render class
    this._renderTiming = new RenderTiming();
  }

  getVideoMemory() {
    return this._vram;
  }

  getAttributeTable() {
    return this._oam;
  }

  step(tick) {
    const result = this._renderTiming.step(tick);
    if (result.shouldScanline) this._framebuffer.renderScanline();
    if (result.lastHblank) this.displayBuffer();
  }

  displayBuffer() {
    const image = this._framebuffer.getImage();
    if (this._canvas) this._canvas.putImageData(image, 0, 0);
  }
}

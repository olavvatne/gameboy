import Memory from '../memory/memory';
import VideoMemory from './video-memory';
import RenderTiming from './timing';
import FrameBuffer from './frame-buffer';

export default class GPU {
  constructor(canvas) {
    this._canvas = canvas;
    this._frameBuffer = new FrameBuffer();
    this._renderTiming = new RenderTiming();
    this._vram = new VideoMemory(2 ** 13, this._frameBuffer);
    this._oam = new Memory(2 ** 8); // TODO: create special memory that trigger actions on gpu
  }

  getVideoMemory() {
    return this._vram;
  }

  getAttributeTable() {
    return this._oam;
  }

  step(tick) {
    const result = this._renderTiming.step(tick);
    if (result.shouldScanline) this._frameBuffer.renderScanline();
    if (result.lastHblank) this.displayBuffer();
  }

  displayBuffer() {
    const image = this._frameBuffer.getImage();
    if (this._canvas) this._canvas.putImageData(image, 0, 0);
  }
}

import Memory from '../memory/memory';
import VideoMemory from './video-memory';
import RenderTiming from './timing';
import FrameBuffer from './frame-buffer';
import Renderer from './renderer';

export default class GPU {
  constructor(screen) {
    this.registers = {
      x: 0, y: 0, tileset: 0, tilemap: 0,
    };
    this.palette = [
      [255, 255, 255],
      [192, 192, 192],
      [96, 96, 96],
      [0, 0, 0],
    ];
    this._frameBuffer = new FrameBuffer();
    this._renderTiming = new RenderTiming();
    this._vram = new VideoMemory(this._frameBuffer);
    this._oam = new Memory(2 ** 8); // TODO: create special memory that trigger actions on gpu
    this._renderer = new Renderer(this._frameBuffer, screen, this._vram, this.registers, this.palette);
  }
  
  setPalette() {
    // TODO: stuff
  }

  removeImage() {
    // TODO: imp
  }

  showImage() {
    // TODO: imp
  }

  getVideoMemory() {
    return this._vram;
  }

  getAttributeTable() {
    return this._oam;
  }

  step(tick) {
    const result = this._renderTiming.step(tick);
    if (result.shouldScanline) this._renderer.renderScanline(this._renderTiming.getLine());
    if (result.lastHblank) this._renderer.displayImage();
  }
}

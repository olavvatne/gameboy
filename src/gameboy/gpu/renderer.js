/* eslint no-bitwise: 0 */
// width: 160 - height: 144

export default class Renderer {
  constructor(buffer, canvas, vram, registers, palette) {
    this._registers = registers;
    this._vram = vram;
    this._canvas = canvas;
    this._frameBuffer = buffer;
    this._palette = palette;
  }

   renderScanline(line) {
     const mapOffset = ((line + this.registers.y) & 0xFF) >> 3;
     const tileOffset = this.registers.x >> 3;
     const tileY = line + this.registers.y & 7;
     const tileX = this.registers.x & 7;
     const canvas = line * 160 * 4; // TODO: what?

     const tileAddr = this._vram.getTileAddressFromMap(this._registers.tilemap, mapOffset);

     for (let i = 0; i < 160; i ++) {
      const tile = this._frameBuffer.getTile(this._registers.tileset, tileAddr);
      // TODO: palette
     }
  }

  getImage() {
    return null;
  }
}

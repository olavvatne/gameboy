/* eslint no-bitwise: 0 */
// width: 160 - height: 144

export default class Renderer {
  constructor(buffer, screen, vram, registers, palette) {
    this._registers = registers;
    this._vram = vram;
    this._screen = screen;
    this._frameBuffer = buffer;
    this._palette = palette;
  }
  _findCurrentPositionInMap(line) {
    this._mapOffset = ((line + this._registers.y) & 0xFF) >> 3;
    this._tileOffset = this._registers.x >> 3;
  }

  _findCurrentTileAddress() {
    const pos = this._mapOffset + this._tileOffset;
    this._tileAddress = this._vram.getTileAddressFromMap(this._registers.tilemap, pos);
  }

  renderScanline(line) {
    this._findCurrentPositionInMap(line);
    this._findCurrentTileAddress();
    const tileY = line + this._registers.y & 7;
    let tileX = this._registers.x & 7;

    for (let i = 0; i < 160; i += 1) {
      const tile = this._frameBuffer.getTile(this._registers.tileset, this._tileAddress);
      const pixel = this._palette[tile[tileY][tileX]];
      this._screen.setPixel(line, i, pixel);

      tileX += 1;
      if (tileX === 8) {
        tileX = 0;
        this._tileOffset = (this._tileOffset + 1) & 0x1F;
        this._findCurrentTileAddress();
      }
    }
  }

  displayImage() {
    this._screen.displayImage();
  }
}

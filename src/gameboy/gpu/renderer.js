/* eslint no-bitwise: 0 */
/* eslint no-continue: 0 */
/* eslint prefer-destructuring: 0 */
// width: 160 - height: 144

export default class Renderer {
  constructor(buffer, oam, screen, vram, registers, palette) {
    this._registers = registers;
    this._vram = vram;
    this._screen = screen;
    this._frameBuffer = buffer;
    this._palette = palette;
    this._oam = oam;
    this.backgroundValues = new Array(144).fill().map(() => new Array(160).fill(0));
  }

  _findCurrentPositionInMap(line) {
    this._mapOffset = (((line + this._registers.y) & 0xFF) >> 3) << 5;
    this._tileOffset = (this._registers.x >> 3) & 0x1F;
  }

  _findCurrentTileAddress() {
    const pos = this._mapOffset + this._tileOffset;
    this._tileAddress = this._vram.getTileAddressFromMap(this._registers.tilemap, pos);
  }

  renderScanline(line) {
    if (!this._registers.lcd) return;
    if (this._registers.bg) this.renderBackground(line);
    if (this._registers.sprite) this.renderSprites(line);
  }

  renderBackground(line) {
    this._findCurrentPositionInMap(line);
    this._findCurrentTileAddress();
    const tileY = (line + this._registers.y) & 7;
    let tileX = (this._registers.x) & 7;

    for (let i = 0; i < 160; i += 1) {
      const tile = this._frameBuffer.getTile(this._registers.tileset, this._tileAddress);
      const PixelVal = tile[tileY][tileX];
      const pixelColor = this._palette.bg[PixelVal];
      this._screen.setPixel(line, i, pixelColor);
      this.backgroundValues[line][i] = PixelVal;

      tileX += 1;
      if (tileX === 8) {
        tileX = 0;
        this._tileOffset = (this._tileOffset + 1) & 0x1F;
        this._findCurrentTileAddress();
      }
    }
  }

  renderSprites(line) {
    for (let i = 0; i < 40; i += 1) {
      const sprite = this._oam.objects[i];
      const placedInLine = sprite.y <= line && (sprite.y + this._registers.spriteHeight) > line;
      if (placedInLine) {
        const pal = sprite.palette ? this._palette.obj1 : this._palette.obj0;
        const tile = this._frameBuffer.getTile(1, sprite.tile);
        const rowIndex = line - sprite.y;
        const row = sprite.flipY ? tile[7 - rowIndex] : tile[rowIndex];

        for (let x = 0; x < 8; x += 1) {
          if (!(sprite.x + x >= 0 && sprite.x + x < 160)) continue;
          const correctedX = sprite.flipX ? 7 - x : x;
          const bgVal = this.backgroundValues[line][sprite.x + x];
          if (row[correctedX] && (sprite.priority || !bgVal)) {
            const color = pal[row[correctedX]];
            this._screen.setPixel(line, sprite.x + x, color);
          }
        }
      }
    }
  }

  renderWindow() {
    const tilemapSize = 32 * 32;
    const wx = this._registers.wx - 7; // wx= 7 and xy = 0 put window at upper left corner
    const wy = this._registers.wy;

    for (let i = 0; i < tilemapSize; i += 1) {
      const x = (i % 32) * 8;
      const y = ((i / 32) | 0) * 8;
      // Entire tile must fit assumtion?
      const isOnScreen = x + wx >= 0 && x + wx < 160 && y + wy >= 0 && y + wy < 144;
      if (isOnScreen) {
        const tileAddr = this._vram.getTileAddressFromMap(this._registers.tilemapWindow, i);
        const tile = this._frameBuffer.getTile(this._registers.tileset, tileAddr);
        this.drawTile(tile, x + wx, y + wy);
      }
    }
  }

  drawTile(tile, x, y) {
    const maxWidth = Math.min(Math.max(166 - x, 0), 8);
    const maxHeight = Math.min(Math.max(144 - y, 0), 8);
    const pal = this._palette.bg;
    for (let i = 0; i < maxHeight; i += 1) {
      for (let j = 0; j < maxWidth; j += 1) {
        const color = pal[tile[i][j]];
        this._screen.setPixel(y + i, x + j, color);
      }
    }
  }

  displayImage() {
    if (this._registers.lcd && this._registers.window) {
      this.renderWindow();
    }
    this._screen.displayImage();
  }
}

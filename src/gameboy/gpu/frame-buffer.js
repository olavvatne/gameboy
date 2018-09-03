/*
  tile based. 8x8 pixels. 256 unique tiles.
  Two maps of 32x32 tiles held in memory. One displayed at the time.
  Space for 384 tiles total in memory.
  8 bits combination in tile map so only 256 unique maps can be addressed.
  Some tiles are therefore shared between the maps.

  8000 - 87FF : Tile set #1 (128 tiles)
  8800 - 8FFF : Shared #1 #2 (256 shared tiles)
  9000 - 97FF : Tile set #0 (128 tiles)
  9800 - 9BFF : Tile map #0 (32x32 tile references)
  9C00 - 9FFF : Tile map #1 (32x32 tile references)
 */
// TODO: create updateTile method which is called from vram
// TODO: getImage should get
// TODO: scroll x and scroll y. Wraps around as well
export default class FrameBuffer {
  constructor() {
  }

  updateTile(address, value) {
    
  }
  renderScanline() {
  }

  getImage() {
    return null;
  }
}

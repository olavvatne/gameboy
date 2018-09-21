import Util from '../util';
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
// TODO: scroll x and scroll y. Wraps around as well

/* eslint no-bitwise: 0 */
/* eslint no-bitwise: 0 */

const numTiles = 384;

const initTileset = () => {
  const tiles = [];
  for (let t = 0; t < numTiles; t += 1) {
    tiles[t] = new Array(8).fill().map(() => new Array(8).fill(0));
  }
  return tiles;
};

export default class FrameBuffer {
  constructor() {
    this.tiles = initTileset();
  }


  updateTile(address, firstByte, secondByte) {
    // 16 bytes per tile. A row is 2 bytes.
    // A tile pixel is 2 bits, one in each of the bytes.

    const tile = (address >> 4) & 0x1FF;
    const row = (address >> 1) & 0x7;
    for (let i = 0; i < 8; i += 1) {
      const bit0 = Util.getBit(firstByte, 7 - i);
      const bit1 = Util.getBit(secondByte, 7 - i);
      const val = bit0 + (bit1 * 2);
      this.tiles[tile][row][i] = val;
    }
  }

  getTile(tileset, tile) {
    if (tileset > 1) throw new Error('Only two tilesets');

    let t = tile;
    if (tileset === 0) {
      t = Util.convertSignedByte(tile);
    }
    if (tileset === 1 && t >= 0 && t < 256) return this.tiles[t];
    const secondSetOffset = 128 * 2;
    if (tileset === 0 && t >= -128 && t < 128) return this.tiles[t + secondSetOffset];
    throw new Error('tile is out of bounds');
  }
}

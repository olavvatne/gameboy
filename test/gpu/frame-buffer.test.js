import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { FrameBuffer, VideoMemory } from '../../src/gameboy/gpu';

describe('GPU', () => {
  let buffer = null;
  let mem = null;
  beforeEach(() => {
    buffer = new FrameBuffer();
    mem = new VideoMemory(buffer);
  });
  const getTileset = () => buffer.tiles;

  describe('Frame buffer tests', () => {
    it('initalize tileset', () => {
      assert.isDefined(buffer);
      assert.isArray(getTileset());
      assert.lengthOf(getTileset(), 384);
      assert.lengthOf(getTileset()[0], 8);
      assert.lengthOf(getTileset()[0][0], 8);

      assert.lengthOf(getTileset()[383], 8);
      assert.lengthOf(getTileset()[383][0], 8);
    });

    it('can access correct tile in tileset 1', () => {
      buffer.tiles[1][0][0] = 3;
      const tile = buffer.getTile(1, 1);
      assert.isArray(tile);
      assert.lengthOf(tile, 8);
      assert.lengthOf(tile[0], 8);
      assert.equal(tile[0][0], 3);
    });

    it('can access tileset 0', () => {
      buffer.tiles[128][0][0] = 4;
      const tile = buffer.getTile(0, -128);
      assert.equal(tile[0][0], 4);
    });

    it('can access same tile in tileset 0 and 1', () => {
      buffer.tiles[129][0][0] = 5;
      const tile = buffer.getTile(1, 129);
      const sameTile = buffer.getTile(0, -127);
      assert.equal(tile[0][0], sameTile[0][0]);
      assert.equal(tile[0][0], 5);
    });

    it('will update tile 0 and calculate tile buffer at corresponding location', () => {
      const rowFirst = 0b00110011;
      const rowSecond = 0b10110010;
      const correctTileRow = [2, 0, 3, 3, 0, 0, 3, 1];
      mem.writeByte(0x00, rowFirst);
      mem.writeByte(0x01, rowSecond);

      assert.deepEqual(buffer.getTile(1, 0)[0], correctTileRow);
    });

    it('will also update tile 127 of tileset 0', () => {
      const rowFirst = 0b11010011;
      const RowSecond = 0b10110010;
      const correctTileRow = [3, 1, 2, 3, 0, 0, 3, 1];
      mem.writeByte(0x00, rowFirst);
      mem.writeByte(0x01, RowSecond);

      assert.deepEqual(buffer.getTile(1, 0)[0], correctTileRow);
    });
  });
});

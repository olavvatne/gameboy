import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import FrameBuffer from '../../src/gameboy/gpu/frame-buffer';
import Util from '../../src/gameboy/util';
import VideoMemory from '../../src/gameboy/gpu/video-memory';

describe('GPU', () => {
  let buffer = null;
  let mem = null;
  beforeEach(() => {
    buffer = new FrameBuffer();
    mem = new VideoMemory(2 ** 13, buffer);
  });
  const getTileset = () => buffer.tileset;

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

    it('has a getBit helper that works correcty', () => {
      const byte = 0b01100111;
      const bitIndices = [7, 6, 5, 4, 3, 2, 1, 0];
      const res = bitIndices.map(idx => Util.getBit(byte, idx));
      assert.deepEqual(res, [0, 1, 1, 0, 0, 1, 1, 1]);
    });

    it('retrieves bits where msb is the leftmost', () => {
      const byte = 0b10000000;
      const msb = Util.getBit(byte, 7);
      const lsb = Util.getBit(byte, 0);
      assert.equal(msb, 1);
      assert.equal(lsb, 0);
    });

    it('can access correct tile in tileset 1', () => {
      buffer.tileset[1][0][0] = 3;
      const tile = buffer.getTile(1, 1);
      assert.isArray(tile);
      assert.lengthOf(tile, 8);
      assert.lengthOf(tile[0], 8);
      assert.equal(tile[0][0], 3);
    });

    it('can access tileset 0', () => {
      buffer.tileset[128][0][0] = 4;
      const tile = buffer.getTile(0, -128);
      assert.equal(tile[0][0], 4);
    });

    it('can access same tile in tileset 0 and 1', () => {
      buffer.tileset[129][0][0] = 5;
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

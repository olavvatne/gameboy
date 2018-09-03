import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import FrameBuffer from '../../src/gameboy/gpu/frame-buffer';

describe('GPU', () => {
  let buffer = null;
  beforeEach(() => {
    buffer = new FrameBuffer();
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
  });
});

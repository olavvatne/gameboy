import { assert } from 'chai';
import { Memory } from '../../src/gameboy/memory';

const getMemory = () => new Memory();

describe('Memory', () => {
  describe('Memory tests', () => {
    it('can initalize with correctly sized memory', () => {
      const memory = getMemory();
      const all = memory.getAll();
      assert.equal(all.byteLength, 2 ** 16);
    });
  });
});

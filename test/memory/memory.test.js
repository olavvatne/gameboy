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

    it('can write a byte to an address', () => {
      const memory = getMemory();
      memory.writeByte(185, 0x23);
      const val = memory.readByte(185);
      assert.equal(val, 0x23);
    });

    it('can write a word to an address', () => {
      const memory = getMemory();
      memory.writeWord(93, 0x3467);
      const val = memory.readWord(93);
      assert.equal(val, 0x3467);
    });

    it('can write a word and read it correctly as bytes', () => {
      const memory = getMemory();
      memory.writeWord(1000, 0xAB67);
      const first = memory.readByte(1000);
      const second = memory.readByte(1001);
      assert.equal(first, 0x67);
      assert.equal(second, 0xAB);
    });
  });
});

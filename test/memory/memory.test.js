import { assert } from 'chai';
import { MMU } from '../../src/gameboy/memory';

const getMemory = () => new MMU();

describe('Memory', () => {
  describe('Memory tests', () => {
    it('can initalize with correctly sized memory', () => {
      const memory = getMemory();
      memory.exitBios();
      memory.writeByte(0x0000, 0x01);
      memory.writeByte(0xFFFF, 0x02);
      memory.writeByte(0xDFFF, 0x03);
      assert.equal(memory.readByte(0x0000), 0x01);
      assert.equal(memory.readByte(0xFFFF), 0x02);
      assert.equal(memory.readByte(0xDFFF), 0x03);
    });

    it('throw if you try to write to bios', () => {
      const memory = getMemory();
      assert.throws(() => memory.writeByte(0x0099, 0x10));
      memory.exitBios();
      assert.doesNotThrow(() => memory.writeByte(0x0099, 0x10));
    });

    it('can write a byte to an address', () => {
      const memory = getMemory();
      memory.writeByte(0x101, 0x23);
      const val = memory.readByte(0x101);
      assert.equal(val, 0x23);
    });

    it('can write a word to an address', () => {
      const memory = getMemory();
      memory.exitBios();
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

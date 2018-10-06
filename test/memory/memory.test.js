import { assert } from 'chai';
import { MMU } from '../../src/gameboy/memory';

const getMemory = () => new MMU();

describe('Memory', () => {
  describe('Memory tests', () => {
    it('can initalize with correctly sized memory', () => {
      const memory = getMemory();
      memory.exitBios();
      memory.writeByte(0x0000, 0x01); // readonly rom
      memory.writeByte(0xFFFF, 0x02);
      memory.writeByte(0xDFFF, 0x03);
      memory.writeByte(0x9000, 0x04);
      assert.notEqual(memory.readByte(0x0000), 0x01);
      assert.equal(memory.readByte(0xFFFF), 0x02);
      assert.equal(memory.readByte(0xDFFF), 0x03);
      assert.equal(memory.readByte(0x9000), 0x04);
    });

    it('enables external ram if written to rom/bios space', () => {
      const memory = getMemory();
      memory.cartridge.type = 1;
      memory.writeByte(0x0099, 0x0A);
      assert.isTrue(memory.cartridge.isExternalRam);
    });

    it('can write a byte to an address', () => {
      const memory = getMemory();
      memory.writeByte(0xC101, 0x23);
      const val = memory.readByte(0xC101);
      assert.equal(val, 0x23);
    });

    it('can write a word to an address', () => {
      const memory = getMemory();
      memory.exitBios();
      memory.writeWord(40093, 0x9467);
      const val = memory.readWord(40093);
      assert.equal(val, 0x9467);
    });

    it('can write a word and read it correctly as bytes', () => {
      const memory = getMemory();
      memory.writeWord(9000, 0xAB67);
      const first = memory.readByte(9000);
      const second = memory.readByte(9001);
      assert.equal(first, 0x67);
      assert.equal(second, 0xAB);
    });
  });
});

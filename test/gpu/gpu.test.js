import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { MMU } from '../../src/gameboy/memory';
import { GPU } from '../../src/gameboy/gpu';

describe('GPU', () => {
  let gpu = null;
  let memory = null;
  beforeEach(() => {
    gpu = new GPU();
    memory = new MMU(gpu.getVideoMemory(), gpu.getAttributeTable());
  });
  describe('vram and oam tests', () => {
    it('writing to memory at certain locations actually write to gpu memory', () => {
      memory.writeByte(0x9999, 0xAA);
      memory.writeWord(0x9100, 0xBBCC);
      memory.writeByte(0xFE00, 0x01);
      memory.writeByte(0xFE9F, 0x02);
      memory.writeWord(0xFE10, 0x0211);
      assert.equal(gpu.getVideoMemory().readByte(0x9999 - 0x8000), 0xAA);
      assert.equal(gpu.getAttributeTable().readByte(0xFE00 - 0xFE00), 0x01);
      assert.equal(gpu.getAttributeTable().readByte(0xFE9F - 0xFE00), 0x02);
    });
  });
});

import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { MMU } from '../../src/gameboy/memory';

describe('Memory', () => {
  let mmu = null;
  beforeEach(() => {
    mmu = new MMU();
  });

  describe('Controller tests', () => {
    it('enables external ram if writing to an area', () => {
      mmu.cartridge.type = 1;
      assert.isFalse(mmu.cartridge.isExternalRam);
      mmu.writeByte(0x1FFE, 0x0A);
      assert.isTrue(mmu.cartridge.isExternalRam);
    });

    it('only enables ram if lower nibble is 0x0A', () => {
      mmu.cartridge.type = 1;
      assert.isFalse(mmu.cartridge.isExternalRam);
      mmu.writeByte(0x1FFE, 0x01);
      assert.isFalse(mmu.cartridge.isExternalRam);
    });

    it('disables external ram if any other value than 0x0A', () => {
      mmu.cartridge.type = 1;
      mmu.writeByte(0x1FFE, 0x0A);
      assert.isTrue(mmu.cartridge.isExternalRam);
      mmu.writeByte(0x1FFE, 0x0B);
      assert.isFalse(mmu.cartridge.isExternalRam);
    });

    it('loads a value from MCB1/rom1 with a offset when default rom type', () => {
      mmu.cartridge.rom[0x4000] = 0x12;
      assert.equal(mmu.readByte(0x4000), 0x12);
    });

    it('can\'t not write to rom part of memory', () => {
      mmu.writeByte(0x0000, 0x12);
      mmu.writeByte(0x2300, 0x01);
      mmu.writeByte(0x6AAA, 0x14);

      assert.notEqual(mmu.readByte(0x0000), 0x12);
      assert.equal(mmu.readByte(0x2300), 0);
      assert.equal(mmu.readByte(0x6AAA), 0);
    });
  });
});

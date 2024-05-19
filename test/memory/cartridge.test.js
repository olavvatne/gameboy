import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import Cartridge from '../../src/gameboy/memory/cartrigde.js';


describe('Memory', () => {
  let cartridge = null;
  beforeEach(() => {
    cartridge = new Cartridge();
  });

  describe('Cartridge tests', () => {
    it('contains rom and ram of certain size', () => {
      assert.isDefined(cartridge.rom);
      assert.isDefined(cartridge.ram);
      assert.lengthOf(cartridge.rom, 2 ** 15);
      assert.lengthOf(cartridge.ram, 2 ** 15);
    });

    it('switch rom bank with lower 5 bits', () => {
      cartridge.type = 1;
      cartridge.setRomBank(0b00000101);
      assert.equal(cartridge.romBank, 5);
      assert.equal(cartridge.romOffset, 5 * 0x4000);
    });

    it('automatically corrects to rom bank 1 in case value for bank 0 is provided', () => {
      cartridge.type = 1;
      cartridge.setRomBank(0b00000000);
      assert.equal(cartridge.romBank, 1);
      assert.equal(cartridge.romOffset, 0x4000);
    });

    it('can select a ram bank', () => {
      cartridge.type = 1;
      cartridge.setRamOrRomMode(1);
      cartridge.setRomBankOrRamBank(0b00000011);

      assert.equal(cartridge.ramBank, 3);
      assert.equal(cartridge.ramOffset, 3 * 0x2000);
    });
  });
});

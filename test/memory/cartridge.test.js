import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import Cartridge from '../../src/gameboy/memory/cartrigde';


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
  });
});

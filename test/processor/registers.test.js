import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import { Registers } from '../../src/gameboy/processor/index.js';

/* eslint prefer-destructuring: 0 */
describe('Processor', () => {
  let reg = null;
  let map = null;
  beforeEach(() => {
    reg = new Registers();
    map = reg.map;
  });

  describe('Register tests', () => {
    it('creates a byte array', () => {
      const correct = DataView.name;

      assert.typeOf(reg._gpr, correct);
    });

    it('creates a byte array big enough for all gameboy registers', () => {
      const numOfGeneralPurpose = 8;

      assert.equal(reg._gpr.byteLength, numOfGeneralPurpose);
    });

    it('sets register A', () => {
      map.a(0xAA);
      const val = map.a();
      assert.equal(0xAA, val);
    });

    it('sets register B', () => {
      map.b(0xFF);
      const val = map.b();
      assert.equal(0xFF, val);
    });

    it('does not set reg B if Reg A is set', () => {
      map.a(0x12);
      const val = map.b();
      assert.notEqual(0x12, val);
    });

    it('sets 16 bit register', () => {
      map.hl(0xAB12);
      const val = map.hl();
      assert.equal(val, 0xAB12);
    });

    it('sets a 16 bit register and can be read as two 8 bit registers', () => {
      // 0xABCD => 1010 1011 1100 1101 => 43981
      // 1010 1011 => 171 => AB  , 1100 1101 => 205 => CD
      map.de(0xABCD);

      assert.equal(map.de(), 0xABCD);
      assert.equal(map.d(), 0xAB);
      assert.equal(map.e(), 0xCD);
    });

    it('can set two 8 bit registers that are read correctly as 16 bit', () => {
      map.h(0x12);
      map.l(0xEF);
      assert.equal(map.hl(), 0x12EF);
    });

    it('will wrap around if incrementing beyond max value', () => {
      const val = 255;
      map.e(val);
      assert.equal(map.e(), val);
      map.e(val + 1);
      assert.equal(map.e(), 0);
      map.e(val + 2);
      assert.equal(map.e(), 1);
    });

    it('will wrap around for 16 bit registers as well', () => {
      const val = 0xFFFF;
      map.de(val);
      assert.equal(map.de(), val);
      map.de(val + 1);
      assert.equal(map.de(), 0);
      map.de(val + 2);
      assert.equal(map.de(), 1);
    });
  });
});

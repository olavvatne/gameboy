import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Registers, RegMap } from '../../src/gameboy/processor';


describe('Processor', () => {
  let reg = null;
  beforeEach(() => {
    reg = new Registers();
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
      reg.reg(RegMap.a, 0xAA);
      const val = reg.reg(RegMap.a);
      assert.equal(0xAA, val);
    });

    it('sets register B', () => {
      reg.reg(RegMap.b, 0xFF);
      const val = reg.reg(RegMap.b);
      assert.equal(0xFF, val);
    });

    it('does not set reg B if Reg A is set', () => {
      reg.reg(RegMap.A, 0x12);
      const val = reg.reg(RegMap.b);
      assert.notEqual(0x12, val);
    });

    it('sets 16 bit register', () => {
      reg.reg(RegMap.hl, 0xAB12);
      const val = reg.reg(RegMap.hl);
      assert.equal(val, 0xAB12);
    });

    it('sets a 16 bit register and can be read as two 8 bit registers', () => {
      // 0xABCD => 1010 1011 1100 1101 => 43981
      // 1010 1011 => 171 => AB  , 1100 1101 => 205 => CD
      reg.reg(RegMap.de, 0xABCD);
      const deVal = reg.reg(RegMap.de);
      const dVal = reg.reg(RegMap.d);
      const eVal = reg.reg(RegMap.e);

      assert.equal(deVal, 0xABCD);
      assert.equal(dVal, 0xAB);
      assert.equal(eVal, 0xCD);
    });

    it('can set two 8 bit registers that are read correctly as 16 bit', () => {
      reg.reg(RegMap.h, 0x12);
      reg.reg(RegMap.l, 0xEF);
      const val = reg.reg(RegMap.hl);
      assert.equal(val, 0x12EF);
    });
  });
});

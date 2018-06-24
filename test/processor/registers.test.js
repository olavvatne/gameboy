import { assert } from 'chai';
import { Registers, RegMap } from '../../src/gameboy/processor';

const getRegister = () => new Registers();

describe('Processor', () => {
  describe('Register tests', () => {
    it('creates a byte array', () => {
      const reg = getRegister();
      const correct = DataView.name;

      assert.typeOf(reg._gpr, correct);
    });

    it('creates a byte array big enough for all gameboy registers', () => {
      const reg = getRegister();
      const numOfGeneralPurpose = 8;

      assert.equal(reg._gpr.byteLength, numOfGeneralPurpose);
    });

    it('sets register A', () => {
      const core = getRegister();
      core.reg(RegMap.a, 0xAA);
      const val = core.reg(RegMap.a);
      assert.equal(0xAA, val);
    });

    it('sets register B', () => {
      const core = getRegister();
      core.reg(RegMap.b, 0xFF);
      const val = core.reg(RegMap.b);
      assert.equal(0xFF, val);
    });

    it('does not set reg B if Reg A is set', () => {
      const core = getRegister();
      core.reg(RegMap.A, 0x12);
      const val = core.reg(RegMap.b);
      assert.notEqual(0x12, val);
    });

    it('sets 16 bit register', () => {
      const core = getRegister();
      core.reg(RegMap.hl, 0xAB12);
      const val = core.reg(RegMap.hl);
      assert.equal(val, 0xAB12);
    });

    it('sets a 16 bit register and can be read as two 8 bit registers', () => {
      // 0xABCD => 1010 1011 1100 1101 => 43981
      // 1010 1011 => 171 => AB  , 1100 1101 => 205 => CD
      const core = getRegister();
      core.reg(RegMap.de, 0xABCD);
      const deVal = core.reg(RegMap.de);
      const dVal = core.reg(RegMap.d);
      const eVal = core.reg(RegMap.e);

      // Little endian
      assert.equal(deVal, 0xABCD);
      assert.equal(dVal, 0xCD);
      assert.equal(eVal, 0xAB);
    });

    it('can set two 8 bit registers that are read correctly as 16 bit', () => {
      const core = getRegister();
      core.reg(RegMap.h, 0x12);
      core.reg(RegMap.l, 0xEF);
      const val = core.reg(RegMap.hl);
      assert.equal(val, 0xEF12);
    });
  });
});

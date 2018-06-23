import { assert } from 'chai';
import { Registers, Reg } from '../../src/gameboy/processor';

const getRegister = () => new Registers();

describe('Processor', () => {
  describe('Register tests', () => {
    it('createsAByteArray', () => {
      const reg = getRegister();
      const correct = Uint8Array.name;

      assert.typeOf(reg._gpr, correct);
    });

    it('createsAByteArrayBigEnoughForAllGameboyRegisters', () => {
      const reg = getRegister();
      const numOfGeneralPurpose = 8;

      assert.equal(reg._gpr.byteLength, numOfGeneralPurpose);
    });

    it('setsRegisterA', () => {
      const core = getRegister();
      core.reg(Reg.a, 0xAA);
      const val = core.reg(Reg.a);
      assert.equal(0xAA, val);
    });

    it('setsRegisterB', () => {
      const core = getRegister();
      core.reg(Reg.b, 0xFF);
      const val = core.reg(Reg.b);
      assert.equal(0xFF, val);
    });

    it('doesNotSetRegBifRegAIsSet', () => {
      const core = getRegister();
      core.reg(Reg.A, 0x12);
      const val = core.reg(Reg.b);
      assert.notEqual(0x12, val);
    });

    it('sets16bitRegister', () => {
      const core = getRegister();
      core.reg(Reg.hl, 0xAB12);
      const val = core.reg(Reg.hl);
      assert.equal(val, 0xAB12);
    });

    it('setsA16bitRegisterAndCanBeReadAsTwo8bitRegisters', () => {
      // 0xABCD => 1010 1011 1100 1101 => 43981
      // 1010 1011 => 171 => AB  , 1100 1101 => 205 => CD
      const core = getRegister();
      core.reg(Reg.de, 0xABCD);
      const deVal = core.reg(Reg.de);
      const dVal = core.reg(Reg.d);
      const eVal = core.reg(Reg.e);

      // Little endian
      assert.equal(deVal, 0xABCD);
      assert.equal(dVal, 0xCD);
      assert.equal(eVal, 0xAB);
    });

    it('canSetTwo8bitRegistersThatAreReadCorrectlyAs16bit', () => {
      const core = getRegister();
      core.reg(Reg.h, 0x12);
      core.reg(Reg.l, 0xEF);
      const val = core.reg(Reg.hl);
      assert.equal(val, 0xEF12);
    });
  });
});

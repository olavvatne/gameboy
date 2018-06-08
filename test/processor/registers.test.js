import { assert } from 'chai';
import { RegisterCore, Reg } from '../../src/gameboy/processor';

const getRegister = () => new RegisterCore();
// Test if Mocha works
describe('Processor', () => {
  describe('Register tests', () => {
    it('createsAByteArray', () => {
      const reg = getRegister();
      const correct = Uint8Array.name;

      assert.typeOf(reg._gpr, correct);
    });

    it('createsAByteArrayBigEnoughForAllGameboyRegisters', () => {
      const reg = getRegister();
      const numOfGeneralPurpose = 7;

      assert.equal(reg._gpr.byteLength, numOfGeneralPurpose);
    });

    it('setRegister', () => {
      const core = getRegister();
      core.reg(Reg.a, 0xAA);
      const val = core.reg(Reg.a);
      assert.equal(0xAA, val);
    });
  });
});

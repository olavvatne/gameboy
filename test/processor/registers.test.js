import { assert } from 'chai'
import {RegisterCore, Reg} from '../../src/gameboy/processor';

const getRegister = () => new RegisterCore();
// Test if Mocha works
describe('Processor', () => {
  describe('Register tests', () => {

    it('createsAByteArray', () => {
      const reg = getRegister();
      const correct = Uint8ClampedArray.name;

      assert.typeOf(reg._regs, correct )
    }),

    it('createsAByteArrayBigEnoughForAllGameboyRegisters', () => {
      const reg = getRegister();
      const numOfGeneralPurpose = 8;
      const numStackAndCounter= 2
      const numFlags = 1;
      console.log(reg._regs);
      assert.equal(reg._regs.byteLength, 8 +1 * (2*numStackAndCounter))
    })
  });
});

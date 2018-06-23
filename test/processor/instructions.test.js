import { assert } from 'chai';
import { CheckFlagFor } from '../../src/gameboy/processor';

/* eslint newline-per-chained-call: 0 */
describe('Processor', () => {
  describe('Flag checker tests', () => {
    it('getsAZeroFlagIfNothingChecked', () => {
      const flag = new CheckFlagFor().get();
      assert.equal(flag, 0);
    });

    it('detectsOverflow', () => {
      const num = 256;
      const flag = new CheckFlagFor().carry(num).get();
      assert.equal(flag, 0b00010000, 2);
    });

    it('setsSubtractionFlag', () => {
      const flag = new CheckFlagFor().subtraction().get();
      assert.equal(flag, 0b01000000);
    });

    it('setsZeroFlagIfResultIsZero', () => {
      const num = 0;
      const flag = new CheckFlagFor().zero(num).get();
      assert.equal(flag, 0b10000000);
    });

    it('canSetMultipleFlags', () => {
      const num = 0;
      const flag = new CheckFlagFor().zero(num).subtraction().carry().get();
      assert.equal(flag, 0b11000000);
    });
  });
});

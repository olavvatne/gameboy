import { assert } from 'chai';
import { it, describe } from 'mocha';
import { CheckFlagFor } from '../../src/gameboy/processor/index.js';

/* eslint newline-per-chained-call: 0 */
describe('Processor', () => {
  describe('Flag checker tests', () => {
    it('getsa zero flag if nothing checked', () => {
      const flag = new CheckFlagFor().get();
      assert.equal(flag, 0);
    });

    it('detects overflow', () => {
      const num = 256;
      const flag = new CheckFlagFor().carry(num).get();
      assert.equal(flag, 0b00010000, 2);
    });

    it('sets subtraction flag', () => {
      const flag = new CheckFlagFor().subtraction().get();
      assert.equal(flag, 0b01000000);
    });

    it('sets zero flag if result is zero', () => {
      const num = 0;
      const flag = new CheckFlagFor().zero(num).get();
      assert.equal(flag, 0b10000000);
    });

    it('can set multiple flags', () => {
      const num = 0;
      const flag = new CheckFlagFor().zero(num).subtraction().carry().get();
      assert.equal(flag, 0b11000000);
    });

    it('can detect half carry on nibbles', () => {
      const num = 16; // 4 bit overflow
      const flag = new CheckFlagFor().setH(num, 15, 1).get();
      assert.equal(flag, 0b00100000);
    });
  });
});

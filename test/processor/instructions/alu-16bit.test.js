import { assert } from 'chai';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Alu 16 bit - instruction set tests', () => {
    it('can increment a register', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.bc, 100);

      Z80.alu16.inc(state, RegMap.bc);
      assert.equal(state.reg.reg(RegMap.bc), 101);
    });

    it('can decrement a register', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.hl, 52);

      Z80.alu16.dec(state, RegMap.hl);
      assert.equal(state.reg.reg(RegMap.hl), 51);
    });

    it('can decrement a stack pointer', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.sp, 172);

      Z80.alu16.dec(state, RegMap.sp);
      assert.equal(state.reg.reg(RegMap.sp), 171);
    });
  });
});

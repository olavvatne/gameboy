import { assert } from 'chai';
import { Z80, Registers, RegMap } from '../../../src/gameboy/processor';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
const getEmptyState = () => ({ reg: new Registers() });

describe('Processor', () => {
  describe('ALU instruction set tests', () => {
    it('can add e to a', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 2);
      state.reg.reg(RegMap.e, 4);

      Z80.alu8.ADDr_e(state);
      assert.equal(state.reg.reg(RegMap.a), 6);
    });

    it('ADDr_e sets carry on overflow', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 254);
      state.reg.reg(RegMap.e, 3);

      Z80.alu8.ADDr_e(state);

      assert.equal(state.reg.reg(RegMap.f), 0b00010000);
    });
  });
});

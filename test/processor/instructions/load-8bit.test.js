import { assert } from 'chai';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Load 8 bit - instruction set tests', () => {
    it('can load from register into memory address specfied by HL', () => {
      // Assumes that (HL) on page 67 of CPU manuel means put register into memory address HL
      const state = getEmptyState();
      state.reg.reg(RegMap.hl, 2005);
      state.reg.reg(RegMap.b, 230);
      state.reg.reg(RegMap.c, 105);

      Z80.load8.LDHLr(state, RegMap.b);
      assert.equal(state.mmu.readByte(2005), 230);
      Z80.load8.LDHLr(state, RegMap.c);
      assert.equal(state.mmu.readByte(2005), 105);
    });
  });
});

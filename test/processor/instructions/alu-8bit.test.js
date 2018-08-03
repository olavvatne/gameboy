import { assert } from 'chai';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Alu 8 bit - instruction set tests', () => {
    it('can add a register and A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.b, 0x04);
      state.reg.reg(RegMap.a, 0x02);

      Z80.alu8.ADDAn(state, RegMap.b);

      assert.equal(state.reg.reg(RegMap.a), 0x06);
    });

    it('can add A and A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x10);

      Z80.alu8.ADDAn(state, RegMap.a);

      assert.equal(state.reg.reg(RegMap.a), 0x10 + 0x10);
    });

    it('sets flags when doing addition', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0xFF);
      state.reg.reg(RegMap.c, 0x01);

      Z80.alu8.ADDAn(state, RegMap.c);
      assert.equal(state.reg.flags(), 0b10110000);
    });

    it('adds value found at addr HL with reg A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x01);
      state.mmu.writeByte(0x1220, 0x03);
      state.reg.reg(RegMap.hl, 0x1220);

      Z80.alu8.ADDAMemHL(state);

      assert.equal(state.reg.flags(), 0);
      assert.equal(state.reg.reg(RegMap.a), 0x04);
    });

    it('can take immediate value and add with reg A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0xF0);
      state.reg.pc(0x3200);
      state.mmu.writeByte(0x3200, 0x01);

      Z80.alu8.ADDAImmediate(state);

      assert.equal(state.reg.reg(RegMap.a), 0xF1);
      assert.isAbove(state.reg.flags(), 0);
      assert.isAbove(state.reg.pc(), 0x3200);
    });

    it('can sum A and a reg + carry flag', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x10);
      state.reg.reg(RegMap.d, 0x01);
      state.reg.flags(RegMap.f, 0b00010000);
      Z80.alu8.ADCAnPlusC(state, RegMap.d);
      const val = state.reg.reg(RegMap.a);

      state.reg.reg(RegMap.a, 0x10);
      state.reg.flags(RegMap.f, 0b00000000);
      Z80.alu8.ADCAnPlusC(state, RegMap.d);
      const val2 = state.reg.reg(RegMap.a);
      assert.notEqual(val, val2);
      assert.equal(val, 0x10 + 0x01 + 1);
    });
  });
});

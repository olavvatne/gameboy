import { assert } from 'chai';
import { it } from 'mocha';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Load 16 bit - instruction set tests', () => {
    it('can put immediate value into a 16 bit register', () => {
      const state = getEmptyState();
      state.reg.pc(0x4444);
      state.mmu.writeWord(0x4444, 0x1000);
      state.reg.reg(RegMap.de, 0x9999);

      Z80.load16.LDImmediateIntoReg(state, RegMap.de);

      assert.equal(state.reg.reg(RegMap.de), 0x1000);
    });

    it('can put HL into stack pointer', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.hl, 0x3214);
      Z80.load16.LDRegToReg(state, RegMap.hl, RegMap.sp);
      assert.equal(state.reg.reg(RegMap.sp), 0x3214);
    });

    it('can put SP + immediate value into HL and affect flags', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.sp, 0x3333);
      state.reg.reg(RegMap.f, 0x99);
      const imAddr = 0x7654;
      const imVal = 0x11;
      // Both over 255 and 16. Will cause carry and half carry to be set.
      const correct = 0x3333 + 0x11;
      state.reg.pc(imAddr);
      state.mmu.writeWord(imAddr, imVal);
      Z80.load16.LDHLFromSPPlusImmediate(state);
      assert.equal(state.reg.reg(RegMap.hl), correct);
      assert.equal(state.reg.flags(), 0b00110000);
    });

    it('can put SP into address determined by immediate value', () => {
      const state = getEmptyState();
      const correct = 0x1212;
      const correctAddr = 0x1222;
      state.reg.reg(RegMap.sp, correct);
      state.reg.pc(0x4545);
      state.mmu.writeWord(0x4545, 0x1222);

      Z80.load16.LDSPIntoImmediate(state);

      assert.isAbove(state.reg.pc(), 0x4545);
      assert.equal(state.mmu.readWord(correctAddr), correct);
    });

    it('can push a register pair onto stack', () => {
      const state = getEmptyState();
      const oldPointer = state.reg.sp();
      const correct = 0x8888;
      state.reg.reg(RegMap.af, correct);

      Z80.load16.PUSHnn(state, RegMap.af);

      assert.equal(state.reg.sp(), oldPointer - 2);
      assert.equal(state.mmu.readWord(state.reg.sp()), correct);
    });

    it('can pop a pushed value on the stack', () => {
      const state = getEmptyState();
      const oldPointer = state.reg.sp();
      const correct = 0x7777;
      state.reg.reg(RegMap.bc, correct);

      Z80.load16.PUSHnn(state, RegMap.bc);
      Z80.load16.POPnn(state, RegMap.de);

      assert.equal(state.reg.reg(RegMap.de), correct);
      assert.equal(state.reg.sp(), oldPointer);
    });
  });
});

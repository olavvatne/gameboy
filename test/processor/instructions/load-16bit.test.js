import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, RegMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  let state = null;
  beforeEach(() => {
    state = getEmptyState();
  });

  describe('Load 16 bit - instruction set tests', () => {
    it('can put immediate value into a 16 bit register', () => {
      state.reg.pc(0x4444);
      state.mmu.writeWord(0x4444, 0x1000);
      state.reg.reg(RegMap.de, 0x9999);

      Z80.load16.ldImmediateIntoReg(state, state.map.de);

      assert.equal(state.reg.reg(RegMap.de), 0x1000);
    });

    it('can put HL into stack pointer', () => {
      state.reg.reg(RegMap.hl, 0x3214);
      Z80.load16.ldRegToReg(state, state.map.hl, state.map.sp);
      assert.equal(state.reg.reg(RegMap.sp), 0x3214);
    });

    it('can put SP + immediate value into HL and affect flags', () => {
      state.reg.reg(RegMap.sp, 0x3333);
      state.reg.reg(RegMap.f, 0x99);
      const imAddr = 0x7654;
      const imVal = 0x11;
      // Over 255. Will cause carry
      const correct = 0x3333 + 0x11;
      state.reg.pc(imAddr);
      state.mmu.writeWord(imAddr, imVal);
      Z80.load16.ldHLFromSPPlusImmediate(state);
      assert.equal(state.reg.reg(RegMap.hl), correct);
      assert.equal(state.reg.flags(), 0b00010000);
    });

    it('can put SP into address determined by immediate value', () => {
      const correct = 0x1212;
      const correctAddr = 0x1222;
      state.reg.reg(RegMap.sp, correct);
      state.reg.pc(0x4545);
      state.mmu.writeWord(0x4545, 0x1222);

      Z80.load16.ldSPIntoImmediate(state);

      assert.isAbove(state.reg.pc(), 0x4545);
      assert.equal(state.mmu.readWord(correctAddr), correct);
    });

    it('can push a register pair onto stack', () => {
      const oldPointer = state.reg.sp();
      const correct = 0x8888;
      state.reg.reg(RegMap.af, correct);

      Z80.load16.push(state, state.map.af);

      assert.equal(state.reg.sp(), oldPointer - 2);
      assert.equal(state.mmu.readWord(state.reg.sp()), correct);
    });

    it('can pop a pushed value on the stack', () => {
      const oldPointer = state.reg.sp();
      const correct = 0x7777;
      state.reg.reg(RegMap.bc, correct);

      Z80.load16.push(state, state.map.bc);
      Z80.load16.pop(state, state.map.de);

      assert.equal(state.reg.reg(RegMap.de), correct);
      assert.equal(state.reg.sp(), oldPointer);
    });

    it('loads immediate into 16 bit register, with endian correct', () => {
      const val = 0xABCD;
      const pcAddr = 0x5565;
      state.mmu.writeByte(pcAddr + 1, 0xAB);
      state.mmu.writeByte(pcAddr, 0xCD);
      state.reg.pc(pcAddr);

      Z80.load16.ldImmediateIntoReg(state, state.map.bc);

      assert.equal(state.reg.reg(RegMap.bc), val);
    });
  });
});

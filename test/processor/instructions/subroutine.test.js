import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, RegMap, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  let state = null;
  beforeEach(() => {
    state = getEmptyState();
  });

  describe('Subroutine - instruction set tests', () => {
    it('pushes address of next instruction onto stack and jumps to immediate', () => {
      state.reg.pc(0x1000);
      state.mmu.writeWord(0x1000, 0xAAAA);

      Z80.subroutine.call(state);

      assert.equal(state.reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(state.mmu.readWord(state.reg.sp()), 0x1000 + immediateOffset);
    });

    it('calls if Z flag is reset', () => {
      const initPc = 0x1000;
      state.reg.pc(initPc);
      state.mmu.writeWord(initPc, 0xAAAA);
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.subroutine.callIfZ(state, false);

      assert.equal(state.reg.pc(), initPc + 2);
      state.reg.pc(initPc);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      Z80.subroutine.callIfZ(state, false);

      assert.equal(state.reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(state.mmu.readWord(state.reg.sp()), 0x1000 + immediateOffset);
    });

    it('calls if Z flag is set', () => {
      const initPc = 0x1000;
      state.reg.pc(initPc);
      state.mmu.writeWord(initPc, 0xAAAA);
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      Z80.subroutine.callIfZ(state, true);

      assert.equal(state.reg.pc(), initPc + 2);
      state.reg.pc(initPc);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.subroutine.callIfZ(state, true);

      assert.equal(state.reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(state.mmu.readWord(state.reg.sp()), 0x1000 + immediateOffset);
    });

    // TODO: convert to parameterized test loop
    it('calls if C flag is reset', () => {
      const initPc = 0x1100;
      state.reg.pc(initPc);
      state.mmu.writeWord(initPc, 0xAAAC);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.callIfC(state, false);

      assert.equal(state.reg.pc(), initPc + 2);
      state.reg.pc(initPc);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.callIfC(state, false);

      assert.equal(state.reg.pc(), 0xAAAC);
      const immediateOffset = 2;
      assert.equal(state.mmu.readWord(state.reg.sp()), 0x1100 + immediateOffset);
    });

    it('calls if C flag is set', () => {
      const initPc = 0x1200;
      state.reg.pc(initPc);
      state.mmu.writeWord(initPc, 0xAAAB);
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.callIfC(state, true);

      assert.equal(state.reg.pc(), initPc + 2);
      state.reg.pc(initPc);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.callIfC(state, true);

      assert.equal(state.reg.pc(), 0xAAAB);
      const immediateOffset = 2;
      assert.equal(state.mmu.readWord(state.reg.sp()), 0x1200 + immediateOffset);
    });

    it('restarts by push present address onto stack and jumping', () => {
      state.reg.pc(0xAAAA);

      Z80.subroutine.rst(state, 0x18);

      assert.equal(state.reg.pc(), 0x0018);
      assert.equal(state.mmu.readWord(state.reg.sp()), 0xAAAA);
    });

    it('can return by popping from stack and jumping to that address', () => {
      state.reg.reg(RegMap.hl, 0x3333);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();

      Z80.subroutine.ret(state);

      assert.equal(state.reg.pc(), 0x3333);
      assert.notEqual(state.reg.sp(), sp);
    });

    it('returns if C flag is reset', () => {
      const returnAddr = 0x8888;
      state.reg.reg(RegMap.hl, returnAddr);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.retIfC(state, false);

      assert.notEqual(state.reg.pc(), returnAddr);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.retIfC(state, false);

      assert.equal(state.reg.pc(), returnAddr);
      assert.notEqual(state.reg.sp(), sp);
    });

    it('returns if C flag is set', () => {
      const returnAddr = 0x8881;
      state.reg.reg(RegMap.hl, returnAddr);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();
      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.retIfC(state, true);

      assert.notEqual(state.reg.pc(), returnAddr);

      state.reg.reg(RegMap.f, new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.retIfC(state, true);

      assert.equal(state.reg.pc(), returnAddr);
      assert.notEqual(state.reg.sp(), sp);
    });

    it('returns if Z flag is reset', () => {
      const returnAddr = 0x8828;
      state.reg.reg(RegMap.hl, returnAddr);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.subroutine.retIfZ(state, false);

      assert.notEqual(state.reg.pc(), returnAddr);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      Z80.subroutine.retIfZ(state, false);

      assert.equal(state.reg.pc(), returnAddr);
      assert.notEqual(state.reg.sp(), sp);
    });

    it('returns if Z flag is set', () => {
      const returnAddr = 0x8381;
      state.reg.reg(RegMap.hl, returnAddr);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();
      state.reg.reg(RegMap.f, new CheckFlagFor().zero(1).get());
      Z80.subroutine.retIfZ(state, true);

      assert.notEqual(state.reg.pc(), returnAddr);

      state.reg.reg(RegMap.f, new CheckFlagFor().zero(0).get());
      Z80.subroutine.retIfZ(state, true);

      assert.equal(state.reg.pc(), returnAddr);
      assert.notEqual(state.reg.sp(), sp);
    });

    it('can return and set enable interupts in one go', () => {
      const retAddr = 0x4324;
      state.reg.reg(RegMap.hl, retAddr);
      Z80.load16.push(state, state.map.hl);
      const sp = state.reg.sp();

      Z80.subroutine.reti(state);

      assert.equal(state.reg.pc(), retAddr);
      assert.notEqual(state.reg.sp(), sp);
      assert.isTrue(state.interupt.enable);
    });
  });
});

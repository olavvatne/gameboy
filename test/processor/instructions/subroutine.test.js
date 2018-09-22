import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
/* eslint prefer-destructuring: 0 */
describe('Processor', () => {
  let state = null;
  let reg = null;
  let mmu = null;
  beforeEach(() => {
    state = getEmptyState();
    reg = state.map;
    mmu = state.mmu;
  });

  describe('Subroutine - instruction set tests', () => {
    it('pushes address of next instruction onto stack and jumps to immediate', () => {
      reg.pc(0x1000);
      mmu.writeWord(0x1000, 0xAAAA);

      Z80.subroutine.call(state);

      assert.equal(reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(mmu.readWord(reg.sp()), 0x1000 + immediateOffset);
    });

    it('calls if Z flag is reset', () => {
      const initPc = 0x1000;
      reg.pc(initPc);
      mmu.writeWord(initPc, 0xAAAA);
      reg.f(new CheckFlagFor().zero(0).get());
      Z80.subroutine.callIfZ(state, false);

      assert.equal(reg.pc(), initPc + 2);
      reg.pc(initPc);

      reg.f(new CheckFlagFor().zero(1).get());
      Z80.subroutine.callIfZ(state, false);

      assert.equal(reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(mmu.readWord(reg.sp()), 0x1000 + immediateOffset);
    });

    it('calls if Z flag is set', () => {
      const initPc = 0x1000;
      reg.pc(initPc);
      mmu.writeWord(initPc, 0xAAAA);
      reg.f(new CheckFlagFor().zero(1).get());
      Z80.subroutine.callIfZ(state, true);

      assert.equal(reg.pc(), initPc + 2);
      reg.pc(initPc);

      reg.f(new CheckFlagFor().zero(0).get());
      Z80.subroutine.callIfZ(state, true);

      assert.equal(reg.pc(), 0xAAAA);
      const immediateOffset = 2;
      assert.equal(mmu.readWord(reg.sp()), 0x1000 + immediateOffset);
    });

    it('calls if C flag is reset', () => {
      const initPc = 0x1100;
      reg.pc(initPc);
      mmu.writeWord(initPc, 0xAAAC);
      reg.f(new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.callIfC(state, false);

      assert.equal(reg.pc(), initPc + 2);
      reg.pc(initPc);

      reg.f(new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.callIfC(state, false);

      assert.equal(reg.pc(), 0xAAAC);
      const immediateOffset = 2;
      assert.equal(mmu.readWord(reg.sp()), 0x1100 + immediateOffset);
    });

    it('calls if C flag is set', () => {
      const initPc = 0x1200;
      reg.pc(initPc);
      mmu.writeWord(initPc, 0xAAAB);
      reg.f(new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.callIfC(state, true);

      assert.equal(reg.pc(), initPc + 2);
      reg.pc(initPc);

      reg.f(new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.callIfC(state, true);

      assert.equal(reg.pc(), 0xAAAB);
      const immediateOffset = 2;
      assert.equal(mmu.readWord(reg.sp()), 0x1200 + immediateOffset);
    });

    it('restarts by push present address onto stack and jumping', () => {
      reg.pc(0xAAAA);

      Z80.subroutine.rst(state, 0x18);

      assert.equal(reg.pc(), 0x0018);
      assert.equal(mmu.readWord(reg.sp()), 0xAAAA);
    });

    it('can return by popping from stack and jumping to that address', () => {
      reg.hl(0x3333);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();

      Z80.subroutine.ret(state);

      assert.equal(reg.pc(), 0x3333);
      assert.notEqual(reg.sp(), sp);
    });

    it('returns if C flag is reset', () => {
      const returnAddr = 0x8888;
      reg.hl(returnAddr);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();
      reg.f(new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.retIfC(state, false);

      assert.notEqual(reg.pc(), returnAddr);

      reg.f(new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.retIfC(state, false);

      assert.equal(reg.pc(), returnAddr);
      assert.notEqual(reg.sp(), sp);
    });

    it('returns if C flag is set', () => {
      const returnAddr = 0x8881;
      reg.hl(returnAddr);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();
      reg.f(new CheckFlagFor().setCarry(false).get());
      Z80.subroutine.retIfC(state, true);

      assert.notEqual(reg.pc(), returnAddr);

      reg.f(new CheckFlagFor().setCarry(true).get());
      Z80.subroutine.retIfC(state, true);

      assert.equal(reg.pc(), returnAddr);
      assert.notEqual(reg.sp(), sp);
    });

    it('returns if Z flag is reset', () => {
      const returnAddr = 0x8828;
      reg.hl(returnAddr);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();
      reg.f(new CheckFlagFor().zero(0).get());
      Z80.subroutine.retIfZ(state, false);

      assert.notEqual(reg.pc(), returnAddr);

      reg.f(new CheckFlagFor().zero(1).get());
      Z80.subroutine.retIfZ(state, false);

      assert.equal(reg.pc(), returnAddr);
      assert.notEqual(reg.sp(), sp);
    });

    it('returns if Z flag is set', () => {
      const returnAddr = 0x8381;
      reg.hl(returnAddr);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();
      reg.f(new CheckFlagFor().zero(1).get());
      Z80.subroutine.retIfZ(state, true);

      assert.notEqual(reg.pc(), returnAddr);

      reg.f(new CheckFlagFor().zero(0).get());
      Z80.subroutine.retIfZ(state, true);

      assert.equal(reg.pc(), returnAddr);
      assert.notEqual(reg.sp(), sp);
    });

    it('can return and set enable interupts in one go', () => {
      const returnAddr = 0x4324;
      reg.hl(returnAddr);
      Z80.load16.push(state, reg.hl);
      const sp = reg.sp();

      Z80.subroutine.reti(state);

      assert.equal(reg.pc(), returnAddr);
      assert.notEqual(reg.sp(), sp);
      assert.isTrue(state.interrupt.enabled);
    });
  });
});

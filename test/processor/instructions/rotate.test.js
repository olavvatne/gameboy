import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import { Z80, CheckFlagFor } from '../../../src/gameboy/processor/index.js';
import getEmptyState from '../../helper/state-helper.js';

// Tests follow instruction manual and opcode map at
// http://www.devrs.com/gb/files/opcodes.html

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
  const getFlags = () => new CheckFlagFor(reg.f());

  describe('Rotate - instruction set tests', () => {
    it('rotates left a to the left, 7th bit to carry', () => {
      const beforeRotate = 0b10101111;
      const afterRotate = 0b01011111;
      reg.a(beforeRotate);
      Z80.rotate.rcla(state);

      assert.equal(reg.a(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates left a plus carry around', () => {
      const beforeRotate = 0b10101111;
      const afterRotate = 0b01011110; // Since carry was zero
      reg.a(beforeRotate);
      Z80.rotate.rla(state);

      assert.equal(reg.a(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates left A plus carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b01000011;
      const prevFlag = new CheckFlagFor().setC(true).get();
      reg.a(beforeRotate);
      reg.f(prevFlag);

      Z80.rotate.rla(state);

      assert.equal(reg.a(), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates right with lsb around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b10010000;
      reg.a(beforeRotate);

      Z80.rotate.rrca(state);

      assert.equal(reg.a(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with unset carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b00010000; // prev carry is zero
      reg.a(beforeRotate);

      Z80.rotate.rra(state);

      assert.equal(reg.a(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with a set carry around', () => {
      const beforeRotate = 0b00100000;
      const afterRotate = 0b10010000; // prev carry is one
      const prevFlag = new CheckFlagFor().setC(true).get();
      reg.a(beforeRotate);
      reg.f(prevFlag);

      Z80.rotate.rra(state);

      assert.equal(reg.a(), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates reg B left with msb around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100001;
      reg.b(beforeRotate);

      Z80.rotate.rlc(state, reg.b);

      assert.equal(reg.b(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates val in mem on addr HL left with msb around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100001;
      const memAddr = 0xAB16;
      mmu.writeByte(memAddr, beforeRotate);
      reg.hl(memAddr);
      Z80.rotate.rlcMemHL(state);

      assert.equal(mmu.readByte(memAddr), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates reg left with carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b01000011;
      const prevFlag = new CheckFlagFor().setC(true).get();
      reg.c(beforeRotate);
      reg.f(prevFlag);

      Z80.rotate.rl(state, reg.c);

      assert.equal(reg.c(), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates val in mem Hl to left with carry around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100000; // no carry from prev
      const memAddr = 0xAB13;
      mmu.writeByte(memAddr, beforeRotate);
      reg.hl(memAddr);
      Z80.rotate.rlMemHL(state);

      assert.equal(mmu.readByte(memAddr), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates reg D right with lsb around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b10010000;
      reg.d(beforeRotate);

      Z80.rotate.rrc(state, reg.d);

      assert.equal(reg.d(), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates val in mem Hl to right with lsb around', () => {
      const beforeRotate = 0b11110001;
      const afterRotate = 0b11111000;
      const memAddr = 0xAB12;
      mmu.writeByte(memAddr, beforeRotate);
      reg.hl(memAddr);
      Z80.rotate.rrcMemHL(state);

      assert.equal(mmu.readByte(memAddr), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with a set carry around', () => {
      const beforeRotate = 0b00100000;
      const afterRotate = 0b10010000; // prev carry is one
      const prevFlag = new CheckFlagFor().setC(true).get();
      reg.h(beforeRotate);
      reg.f(prevFlag);

      Z80.rotate.rr(state, reg.h);

      assert.equal(reg.h(), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates val in mem Hl to right with lsb around', () => {
      const beforeRotate = 0b11110001;
      const afterRotate = 0b01111000;
      const memAddr = 0x9564;
      mmu.writeByte(memAddr, beforeRotate);
      reg.hl(memAddr);
      Z80.rotate.rrMemHL(state);

      assert.equal(mmu.readByte(memAddr), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('should stay 8 bit when rotating left, or else the zero check does not work', () => {
      const beforeRotate = 0b10000000;
      const afterRotate = 0b00000000;
      const prevFlag = new CheckFlagFor().get();
      reg.c(beforeRotate);
      reg.f(prevFlag);

      Z80.rotate.rl(state, reg.c);

      assert.equal(reg.c(), afterRotate);
      assert.isTrue(getFlags().isCarry());
      assert.isTrue(getFlags().isZero());
    });
  });
});

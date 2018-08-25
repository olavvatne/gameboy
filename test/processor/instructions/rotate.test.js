import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, RegMap, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

// Tests follow instruction manual and opcode map at
// http://www.devrs.com/gb/files/opcodes.html

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  let state = null;
  beforeEach(() => {
    state = getEmptyState();
  });
  const getFlags = () => new CheckFlagFor(state.reg.flags());

  describe('Rotate - instruction set tests', () => {
    it('rotates left a to the left, 7th bit to carry', () => {
      const beforeRotate = 0b10101111;
      const afterRotate = 0b01011111;
      state.reg.reg(RegMap.a, beforeRotate);
      Z80.rotate.rcla(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates left a plus carry around', () => {
      const beforeRotate = 0b10101111;
      const afterRotate = 0b01011110; // Since carry was zero
      state.reg.reg(RegMap.a, beforeRotate);
      Z80.rotate.rla(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates left A plus carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b01000011;
      const prevFlag = new CheckFlagFor().setCarry(true).get();
      state.reg.reg(RegMap.a, beforeRotate);
      state.reg.reg(RegMap.f, prevFlag);

      Z80.rotate.rla(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates right with lsb around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b10010000;
      state.reg.reg(RegMap.a, beforeRotate);

      Z80.rotate.rrca(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with unset carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b00010000; // prev carry is zero
      state.reg.reg(RegMap.a, beforeRotate);

      Z80.rotate.rra(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with a set carry around', () => {
      const beforeRotate = 0b00100000;
      const afterRotate = 0b10010000; // prev carry is one
      const prevFlag = new CheckFlagFor().setCarry(true).get();
      state.reg.reg(RegMap.a, beforeRotate);
      state.reg.reg(RegMap.f, prevFlag);

      Z80.rotate.rra(state);

      assert.equal(state.reg.reg(RegMap.a), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates reg B left with msb around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100001;
      state.reg.reg(RegMap.b, beforeRotate);

      Z80.rotate.rlc(state, RegMap.b);

      assert.equal(state.reg.reg(RegMap.b), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates val in mem on addr HL left with msb around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100001;
      state.mmu.writeByte(0x1234, beforeRotate);
      state.reg.reg(RegMap.hl, 0x1234);
      Z80.rotate.rlcMemHL(state);

      assert.equal(state.mmu.readByte(0x1234), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates reg left with carry around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b01000011;
      const prevFlag = new CheckFlagFor().setCarry(true).get();
      state.reg.reg(RegMap.c, beforeRotate);
      state.reg.reg(RegMap.f, prevFlag);

      Z80.rotate.rl(state, RegMap.c);

      assert.equal(state.reg.reg(RegMap.c), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates val in mem Hl to left with carry around', () => {
      const beforeRotate = 0b11110000;
      const afterRotate = 0b11100000; // no carry from prev
      state.mmu.writeByte(0x1234, beforeRotate);
      state.reg.reg(RegMap.hl, 0x1234);
      Z80.rotate.rlMemHL(state);

      assert.equal(state.mmu.readByte(0x1234), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates reg D right with lsb around', () => {
      const beforeRotate = 0b00100001;
      const afterRotate = 0b10010000;
      state.reg.reg(RegMap.d, beforeRotate);

      Z80.rotate.rrc(state, RegMap.d);

      assert.equal(state.reg.reg(RegMap.d), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates val in mem Hl to right with lsb around', () => {
      const beforeRotate = 0b11110001;
      const afterRotate = 0b11111000;
      state.mmu.writeByte(0x1234, beforeRotate);
      state.reg.reg(RegMap.hl, 0x1234);
      Z80.rotate.rrcMemHL(state);

      assert.equal(state.mmu.readByte(0x1234), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });

    it('rotates right with a set carry around', () => {
      const beforeRotate = 0b00100000;
      const afterRotate = 0b10010000; // prev carry is one
      const prevFlag = new CheckFlagFor().setCarry(true).get();
      state.reg.reg(RegMap.h, beforeRotate);
      state.reg.reg(RegMap.f, prevFlag);

      Z80.rotate.rr(state, RegMap.h);

      assert.equal(state.reg.reg(RegMap.h), afterRotate);
      assert.isFalse(getFlags().isCarry());
    });

    it('rotates val in mem Hl to right with lsb around', () => {
      const beforeRotate = 0b11110001;
      const afterRotate = 0b01111000;
      state.mmu.writeByte(0x1234, beforeRotate);
      state.reg.reg(RegMap.hl, 0x1234);
      Z80.rotate.rrMemHL(state);

      assert.equal(state.mmu.readByte(0x1234), afterRotate);
      assert.isTrue(getFlags().isCarry());
    });
  });
});

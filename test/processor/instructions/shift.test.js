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

  describe('Shift - instruction set tests', () => {
    it('shifts left reg L, msb to carry', () => {
      const beforeShift = 0b10101111;
      const afterShift = 0b01011110;
      reg.l(beforeShift);
      Z80.shift.sla(state, reg.l);

      assert.equal(reg.l(), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts left reg L, msb to carry', () => {
      const beforeShift = 0b00101111;
      const afterShift = 0b01011110;
      reg.l(beforeShift);
      Z80.shift.sla(state, reg.l);

      assert.equal(reg.l(), afterShift);
      assert.isFalse(getFlags().isCarry());
    });

    it('shifts val in mem Hl to left, msb to carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11100010;
      const memAddr = 0x9435;
      mmu.writeByte(memAddr, beforeShift);
      reg.hl(memAddr);
      Z80.shift.slaMemHL(state);

      assert.isNumber(mmu.readByte(memAddr));
      assert.equal(mmu.readByte(memAddr), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right Reg E, keeps msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11111000;
      reg.e(beforeShift);
      Z80.shift.sra(state, reg.e);

      assert.equal(reg.e(), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right mem HL val, keeps msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11111000;
      const memAddr = 0x9235;
      mmu.writeByte(memAddr, beforeShift);
      reg.hl(memAddr);
      Z80.shift.sraMemHL(state);

      assert.isNumber(mmu.readByte(memAddr));
      assert.equal(mmu.readByte(memAddr), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right Reg E, resets msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b01111000;
      reg.e(beforeShift);
      Z80.shift.srl(state, reg.e);

      assert.equal(reg.e(), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right mem HL val, resets msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b01111000;
      const memAddr = 0x9235;
      mmu.writeByte(memAddr, beforeShift);
      reg.hl(memAddr);
      Z80.shift.srlMemHL(state);

      assert.isNumber(mmu.readByte(memAddr));
      assert.equal(mmu.readByte(memAddr), afterShift);
      assert.isTrue(getFlags().isCarry());
    });
  });
});

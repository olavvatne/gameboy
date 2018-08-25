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

  describe('Shift - instruction set tests', () => {
    it('shifts left reg L, msb to carry', () => {
      const beforeShift = 0b10101111;
      const afterShift = 0b01011110;
      state.reg.reg(RegMap.l, beforeShift);
      Z80.shift.sla(state, RegMap.l);

      assert.equal(state.reg.reg(RegMap.l), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts left reg L, msb to carry', () => {
      const beforeShift = 0b00101111;
      const afterShift = 0b01011110;
      state.reg.reg(RegMap.l, beforeShift);
      Z80.shift.sla(state, RegMap.l);

      assert.equal(state.reg.reg(RegMap.l), afterShift);
      assert.isFalse(getFlags().isCarry());
    });

    it('shifts val in mem Hl to left, msb to carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11100010;
      state.mmu.writeByte(0x1235, beforeShift);
      state.reg.reg(RegMap.hl, 0x1235);
      Z80.shift.slaMemHL(state);

      assert.isNumber(state.mmu.readByte(0x1235));
      assert.equal(state.mmu.readByte(0x1235), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right Reg E, keeps msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11111000;
      state.reg.reg(RegMap.e, beforeShift);
      Z80.shift.sra(state, RegMap.e);

      const val = state.reg.reg(RegMap.e);
      assert.equal(val, afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right mem HL val, keeps msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b11111000;
      state.mmu.writeByte(0x1235, beforeShift);
      state.reg.reg(RegMap.hl, 0x1235);
      Z80.shift.sraMemHL(state);

      assert.isNumber(state.mmu.readByte(0x1235));
      assert.equal(state.mmu.readByte(0x1235), afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right Reg E, resets msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b01111000;
      state.reg.reg(RegMap.e, beforeShift);
      Z80.shift.srl(state, RegMap.e);

      const val = state.reg.reg(RegMap.e);
      assert.equal(val, afterShift);
      assert.isTrue(getFlags().isCarry());
    });

    it('shifts right mem HL val, resets msb, and put lsb in carry', () => {
      const beforeShift = 0b11110001;
      const afterShift = 0b01111000;
      state.mmu.writeByte(0x1235, beforeShift);
      state.reg.reg(RegMap.hl, 0x1235);
      Z80.shift.srlMemHL(state);

      assert.isNumber(state.mmu.readByte(0x1235));
      assert.equal(state.mmu.readByte(0x1235), afterShift);
      assert.isTrue(getFlags().isCarry());
    });
  });
});

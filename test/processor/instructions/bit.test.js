import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, RegMap, CheckFlagFor, opcodes } from '../../../src/gameboy/processor';
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

  describe('Bit - instruction set tests', () => {
    it('tests bit 3 of reg B', () => {
      const val = 0b00001000;
      state.reg.reg(RegMap.b, val);
      Z80.bit.bit(state, RegMap.b, 3);

      assert.isFalse(getFlags().isZero());
    });

    it('tests bit 7 of reg D', () => {
      const val = 0b01111111;
      state.reg.reg(RegMap.d, val);
      Z80.bit.bit(state, RegMap.d, 7);
      assert.isTrue(getFlags().isZero());
      Z80.bit.bit(state, RegMap.d, 6);
      assert.isFalse(getFlags().isZero());
    });

    it('tests bit in a mem location found in reg HL', () => {
      const val = 0b11111110;
      state.reg.reg(RegMap.hl, 0x7777);
      state.mmu.writeByte(0x7777, val);
      Z80.bit.bit(state, RegMap.hl, 0);
      assert.isTrue(getFlags().isZero());
    });

    it('will not affect carry, set half carry and reset negation flag', () => {
      const flag = new CheckFlagFor().subtraction().setCarry(true).setHalfCarry(false).get();
      state.reg.reg(RegMap.f, flag);
      Z80.bit.bit(state, RegMap.a, 1); // register is zero, so bit will test positive

      const result = getFlags();
      assert.isTrue(result.isZero());
      assert.isFalse(result.isSubtraction());
      assert.isTrue(result.isHalfCarry());
      assert.isTrue(result.isCarry());
    });

    it('sets bit 1 in Reg A', () => {
      const val = 0b11111101;
      state.reg.reg(RegMap.a, val);
      Z80.bit.set(state, RegMap.a, 1);
      assert.equal(state.reg.reg(RegMap.a), 0b11111111);
    });

    it('sets bit 7 of mem location found in HL', () => {
      const val = 0b00000010;
      state.reg.reg(RegMap.hl, 0x5555);
      state.mmu.writeByte(0x5555, val);
      Z80.bit.set(state, RegMap.hl, 7);
      const result = state.mmu.readByte(0x5555);
      assert.equal(result, 0b10000010);
    });

    it('resets bit 5 in reg L', () => {
      const val = 0b00100000;
      state.reg.reg(RegMap.l, val);
      Z80.bit.res(state, RegMap.l, 5);
      assert.equal(state.reg.reg(RegMap.l), 0);
    });

    it('resets bit 2 of mem location found in HL', () => {
      const val = 0b00000111;
      state.reg.reg(RegMap.hl, 0x5555);
      state.mmu.writeByte(0x5555, val);
      Z80.bit.res(state, RegMap.hl, 2);
      const result = state.mmu.readByte(0x5555);
      assert.equal(result, 0b00000011);
    });

    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    it('maps bit seemingly correctly into opcode map', () => {
      // 0xCB47 -> Bit, 0, A
      state.reg.reg(RegMap.a, 0b11111110);
      const op = opcodes[0xCB47];
      assert.isDefined(op);
      op(state);
      assert.isTrue(getFlags().isZero());

      // 0xCB51 -> Bit, 2, C
      state.reg.reg(RegMap.c, 0b11111011);
      const op2 = opcodes[0xCB51];
      assert.isDefined(op2);
      op2(state);
      assert.isTrue(getFlags().isZero());
    });

    it('maps set seemingly correctly into opcode map', () => {
      // 0xCBFF -> Set, 7, A
      state.reg.reg(RegMap.a, 0b01000000);
      const op = opcodes[0xCBFF];
      assert.isDefined(op);
      op(state);
      assert.equal(state.reg.reg(RegMap.a), 0b11000000);

      // 0xCBD3 -> Set, 2, E
      state.reg.reg(RegMap.e, 0b11111011);
      const op2 = opcodes[0xCBD3];
      assert.isDefined(op2);
      op2(state);
      assert.equal(state.reg.reg(RegMap.e), 0xFF);
    });

    it('maps res seemingly correctly into opcode map', () => {
      // 0xCB80 -> Res, 0, B
      state.reg.reg(RegMap.b, 0b11111101);
      const op = opcodes[0xCB80];
      assert.isDefined(op);
      op(state);
      assert.equal(state.reg.reg(RegMap.b), 0b11111100);

      // 0xCB9A -> Res, 3, D
      state.reg.reg(RegMap.d, 0b11111111);
      const op2 = opcodes[0xCB9A];
      assert.isDefined(op2);
      op2(state);
      assert.equal(state.reg.reg(RegMap.d), 0b11110111);
    });
  });
});

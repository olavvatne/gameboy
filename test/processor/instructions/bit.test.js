import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, CheckFlagFor, opcodes, NameMap } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

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

  describe('Bit - instruction set tests', () => {
    it('tests bit 3 of reg B', () => {
      const val = 0b00001000;
      reg.b(val);
      Z80.bit.bit(state, NameMap.b, 3);

      assert.isFalse(getFlags().isZero());
    });

    it('tests bit 7 of reg D', () => {
      const val = 0b01111111;
      reg.d(val);
      Z80.bit.bit(state, NameMap.d, 7);
      assert.isTrue(getFlags().isZero());
      Z80.bit.bit(state, NameMap.d, 6);
      assert.isFalse(getFlags().isZero());
    });

    it('tests bit in a mem location found in reg HL', () => {
      const val = 0b11111110;
      reg.hl(0x7777);
      mmu.writeByte(0x7777, val);
      Z80.bit.bit(state, NameMap.hl, 0);
      assert.isTrue(getFlags().isZero());
    });

    it('will not affect carry, set half carry and reset negation flag', () => {
      const flag = new CheckFlagFor().subtraction().setC(true).setHalfCarry(false).get();
      reg.f(flag);
      Z80.bit.bit(state, NameMap.a, 1); // register is zero, so bit will test positive

      const result = getFlags();
      assert.isTrue(result.isZero());
      assert.isFalse(result.isSubtraction());
      assert.isTrue(result.isHalfCarry());
      assert.isTrue(result.isCarry());
    });

    it('sets bit 1 in Reg A', () => {
      const val = 0b11111101;
      reg.a(val);
      Z80.bit.set(state, NameMap.a, 1);
      assert.equal(reg.a(), 0b11111111);
    });

    it('sets bit 7 of mem location found in HL', () => {
      const val = 0b00000010;
      const valInHL = 0x5555;
      reg.hl(valInHL);
      mmu.writeByte(valInHL, val);
      Z80.bit.set(state, NameMap.hl, 7);
      const result = mmu.readByte(valInHL);
      assert.equal(result, 0b10000010);
    });

    it('resets bit 5 in reg L', () => {
      const val = 0b00100000;
      reg.l(val);
      Z80.bit.res(state, NameMap.l, 5);
      assert.equal(reg.l(), 0);
    });

    it('resets bit 2 of mem location found in HL', () => {
      const val = 0b00000111;
      const valInHL = 0x5555;
      reg.hl(valInHL);
      mmu.writeByte(valInHL, val);
      Z80.bit.res(state, NameMap.hl, 2);
      const result = mmu.readByte(valInHL);
      assert.equal(result, 0b00000011);
    });

    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    it('maps bit seemingly correctly into opcode map', () => {
      // 0xCB47 -> Bit, 0, A
      reg.a(0b11111110);
      const op = opcodes[0xCB47];
      assert.isDefined(op);
      op(state);
      assert.isTrue(getFlags().isZero());

      // 0xCB51 -> Bit, 2, C
      reg.c(0b11111011);
      const op2 = opcodes[0xCB51];
      assert.isDefined(op2);
      op2(state);
      assert.isTrue(getFlags().isZero());
    });

    it('maps set seemingly correctly into opcode map', () => {
      // 0xCBFF -> Set, 7, A
      reg.a(0b01000000);
      const op = opcodes[0xCBFF];
      assert.isDefined(op);
      op(state);
      assert.equal(reg.a(), 0b11000000);

      // 0xCBD3 -> Set, 2, E
      reg.e(0b11111011);
      const op2 = opcodes[0xCBD3];
      assert.isDefined(op2);
      op2(state);
      assert.equal(reg.e(), 0xFF);
    });

    it('maps res seemingly correctly into opcode map', () => {
      // 0xCB80 -> Res, 0, B
      reg.b(0b11111101);
      const op = opcodes[0xCB80];
      assert.isDefined(op);
      op(state);
      assert.equal(reg.b(), 0b11111100);

      // 0xCB9A -> Res, 3, D
      reg.d(0b11111111);
      const op2 = opcodes[0xCB9A];
      assert.isDefined(op2);
      op2(state);
      assert.equal(reg.d(), 0b11110111);
    });
  });
});

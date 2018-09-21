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

  const getFlags = () => new CheckFlagFor(state.reg.flags());

  describe('Alu 8 bit - instruction set tests', () => {
    it('can add a register and A', () => {
      state.reg.reg(RegMap.b, 0x04);
      state.reg.reg(RegMap.a, 0x02);

      Z80.alu8.add(state, state.map.b);

      assert.equal(state.reg.reg(RegMap.a), 0x06);
    });

    it('can add A and A', () => {
      state.reg.reg(RegMap.a, 0x10);

      Z80.alu8.add(state, state.map.a);

      assert.equal(state.reg.reg(RegMap.a), 0x10 + 0x10);
    });

    it('sets flags when doing addition', () => {
      state.reg.reg(RegMap.a, 0xFF);
      state.reg.reg(RegMap.c, 0x01);

      Z80.alu8.add(state, state.map.c);
      assert.equal(state.reg.flags(), 0b10010000);

      state.reg.reg(RegMap.c, 0x10);
      Z80.alu8.add(state, state.map.c);
      assert.equal(state.reg.flags(), 0b00100000);
    });

    it('adds value found at addr HL with reg A', () => {
      state.reg.reg(RegMap.a, 0x01);
      state.mmu.writeByte(0x1220, 0x03);
      state.reg.reg(RegMap.hl, 0x1220);

      Z80.alu8.addMemHL(state);

      assert.equal(state.reg.flags(), 0);
      assert.equal(state.reg.reg(RegMap.a), 0x04);
    });

    it('can take immediate value and add with reg A', () => {
      state.reg.reg(RegMap.a, 0xF0);
      state.reg.pc(0x3200);
      state.mmu.writeByte(0x3200, 0x01);

      Z80.alu8.addImmediate(state);

      assert.equal(state.reg.reg(RegMap.a), 0xF1);
      assert.isAbove(state.reg.flags(), 0);
      assert.isAbove(state.reg.pc(), 0x3200);
    });

    it('can sum A and a reg + carry flag', () => {
      state.reg.reg(RegMap.a, 0x10);
      state.reg.reg(RegMap.d, 0x01);
      state.reg.reg(RegMap.f, 0b00010000);
      Z80.alu8.adcPlusCarry(state, state.map.d);
      const val = state.reg.reg(RegMap.a);

      state.reg.reg(RegMap.a, 0x10);
      state.reg.reg(RegMap.f, 0b00000000);
      Z80.alu8.adcPlusCarry(state, state.map.d);
      const val2 = state.reg.reg(RegMap.a);
      assert.notEqual(val, val2);
      assert.equal(val, 0x10 + 0x01 + 1);
    });

    it('can sum value in mem with reg + carry flag', () => {
      state.reg.reg(RegMap.a, 0x1);
      state.mmu.writeByte(0x2222, 0x01);
      state.reg.reg(RegMap.hl, 0x2222);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.adcMemHLPlusCarry(state);
      const val = state.reg.reg(RegMap.a);

      assert.equal(val, 3);
    });

    it('can sum immediate value with A + carry flag', () => {
      const nextInMem = 0x2223;
      const immediateVal = 0x23;
      const valInA = 0x10;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(nextInMem);
      state.mmu.writeByte(nextInMem, immediateVal);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.adcImmediatePlusCarry(state);
      const val = state.reg.reg(RegMap.a);
      const pc = state.reg.pc();

      assert.equal(val, immediateVal + valInA + 1);
      assert.equal(pc, nextInMem + 1);
    });

    it('can subtract a from any 8 bit reg', () => {
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, 0x11);
      state.reg.reg(RegMap.c, 0x22);

      Z80.alu8.sub(state, state.map.b);
      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - 0x11);

      Z80.alu8.sub(state, state.map.c);
      const val2 = state.reg.reg(RegMap.a);
      assert.equal(val2, valInA - 0x11 - 0x22);
    });

    it('sets zero flags when subtracting', () => {
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);

      Z80.alu8.sub(state, state.map.a);
      assert.isTrue(getFlags().isZero());
    });

    it('sets subtraction flag when subtracting', () => {
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);

      Z80.alu8.sub(state, state.map.b);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can subtract val from mem with A', () => {
      const valInA = 0xDD;
      const memAddr = 0x5555;
      const memVal = 0x44;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, memVal);

      Z80.alu8.subMemHL(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - memVal);
      const flag = getFlags();
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract immediate from A', () => {
      const valInA = 0xEE;
      const pcMemAddr = 0x6662;
      const memVal = 0x59;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(pcMemAddr);
      state.mmu.writeByte(pcMemAddr, memVal);

      Z80.alu8.subImmediate(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - memVal);
      const flag = getFlags();
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract reg plus carry from A', () => {
      const valInA = 0xBE;
      const valInB = 0x99;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.sbc(state, state.map.b);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - valInB - 1);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can subtract Mem HL plus carry from A', () => {
      const valInA = 0xBE;
      const memAddr = 0x5555;
      const memVal = 0x44;
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, memVal);
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.sbcMemHL(state, RegMap.b);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - memVal - 1);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can take the logical and of a reg and A', () => {
      const valInA = 0b10001000;
      const valInB = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);

      Z80.alu8.and(state, state.map.b);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00001000);
      assert.equal(state.reg.flags(), 0b00100000);
    });

    it('takes logical and of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.andMemHL(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00011000);
    });

    it('takes logical and of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.andImmediate(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00000010);
    });

    it('can take the logical or of a reg and A', () => {
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, valInC);

      Z80.alu8.or(state, state.map.c);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10001000);
      assert.equal(state.reg.flags(), 0b00000000);
    });

    it('takes logical or of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.orMemHL(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00011100);
    });

    it('takes logical or of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.orImmediate(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10000011);
    });

    it('can take the logical xor of a reg and A', () => {
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, valInC);
      Z80.alu8.xor(state, state.map.c);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10000000);
      assert.equal(state.reg.flags(), 0b00000000);
    });

    it('takes logical xor of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.xorMemHL(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00000100);
    });

    it('takes logical xor of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.xorImmediate(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10000001);
    });

    it('compare reg with A and set flags', () => {
      const valInA = 0x15;
      const valInD = 0x15;
      const valInL = 0x14;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.d, valInD);
      state.reg.reg(RegMap.l, valInL);

      Z80.alu8.cp(state, state.map.d);
      const flag1 = getFlags();
      assert.isTrue(flag1.isZero());
      assert.isTrue(flag1.isSubtraction());

      Z80.alu8.cp(state, state.map.l);
      const flag2 = getFlags();
      assert.isTrue(flag2.isSubtraction());
      const isZero = flag2.isZero();
      assert.isNotTrue(isZero);
    });

    it('has a flagchecker that reports correct attributes', () => {
      let pattern = 0b10000000;
      const actualZero = new CheckFlagFor(pattern).isZero();
      pattern = 0b01000000;
      const notZero = new CheckFlagFor(pattern).isZero();
      pattern = 0b00100000;
      const notZero2 = new CheckFlagFor(pattern).isZero();
      pattern = 0b00010000;
      const notZero3 = new CheckFlagFor(pattern).isZero();
      assert.isTrue(actualZero);
      assert.isFalse(notZero);
      assert.isFalse(notZero2);
      assert.isFalse(notZero3);
    });

    it('compares A and Mem HL', () => {
      const valInA = 0x99;
      const valInMem = 0x08;
      const memAddr = 0x7645;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.cpMemHL(state);

      const val = state.reg.flags();
      assert.equal(val, 0b01000000);
    });

    it('takes logical xor of immediate and A', () => {
      const valInA = 0x20;
      const valInMem = 0x80;
      const memAddr = 0x7644;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.cpImmediate(state);

      const val = state.reg.flags();
      assert.equal(val, 0b01010000);
    });

    it('can increment a register', () => {
      const valInD = 0x51;
      state.reg.reg(RegMap.d, valInD);

      Z80.alu8.inc(state, state.map.d);

      assert.equal(valInD + 1, state.reg.reg(RegMap.d));
    });

    it('can decrement a register', () => {
      const valInC = 0x21;
      state.reg.reg(RegMap.c, valInC);

      Z80.alu8.dec(state, state.map.c);

      assert.equal(valInC - 1, state.reg.reg(RegMap.c));
      assert.equal(0, state.reg.reg(RegMap.a));
    });

    it('sets zero flag on increment', () => {
      const valInD = -1;
      state.reg.reg(RegMap.d, valInD);

      Z80.alu8.inc(state, state.map.d);
      const flags = getFlags();
      assert.isTrue(flags.isZero());
    });

    it('reset subtraction flag and keep prev carry flag on increment', () => {
      const valInD = 0x02;
      state.reg.reg(RegMap.d, valInD);
      state.reg.reg(RegMap.f, 0b01010000);

      Z80.alu8.inc(state, state.map.d);
      const flags = getFlags();
      assert.isTrue(flags.isCarry());
      assert.isFalse(flags.isSubtraction());
    });

    it('checks zero, sets subtraction and keeps previous carry on decrement', () => {
      const valInD = 0x01;
      state.reg.reg(RegMap.d, valInD);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.dec(state, state.map.d);
      const flags = getFlags();
      assert.isTrue(flags.isCarry());
      assert.isTrue(flags.isZero());
      assert.isTrue(flags.isSubtraction());
    });

    it('increments value in memAddr found in HL', () => {
      const memAddrInHL = 0x4342;
      const valueInMem = 0x54;
      state.reg.reg(RegMap.hl, memAddrInHL);
      state.mmu.writeByte(memAddrInHL, valueInMem);

      Z80.alu8.incMemHL(state);

      assert.equal(valueInMem + 1, state.mmu.readByte(memAddrInHL));
    });

    it('decrements value in mem with addr found in HL', () => {
      const memAddrInHL = 0x4342;
      const valueInMem = 0x55;
      state.reg.reg(RegMap.hl, memAddrInHL);
      state.mmu.writeByte(memAddrInHL, valueInMem);

      Z80.alu8.decMemHL(state);

      assert.equal(valueInMem - 1, state.mmu.readByte(memAddrInHL));
    });

    it('should set half carry flag if there was a borrow from bit 4 to bit 3', () => {
      const willCauseHalfCarry = 0b00010000;

      state.reg.reg(RegMap.b, willCauseHalfCarry);

      Z80.alu8.dec(state, state.map.b);

      assert.isTrue(getFlags().isHalfCarry());

      const notCarry = 0b00001111;
      state.reg.reg(RegMap.b, notCarry);

      Z80.alu8.dec(state, state.map.b);

      assert.isFalse(getFlags().isHalfCarry());

      const notCarry2 = 0b00010001;
      state.reg.reg(RegMap.b, notCarry2);

      Z80.alu8.dec(state, state.map.b);

      assert.isFalse(getFlags().isHalfCarry());
    });

    it('set borrow flag on subtraction which result in borrow', () => {
      const valInA = 0x09;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, 0x10);

      Z80.alu8.sub(state, state.map.b);
      assert.isTrue(getFlags().isCarry());
    });

    it('does not set carry borrow if A is bigger than what we subtract', () => {
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, 0x10);

      Z80.alu8.sub(state, state.map.c);
      assert.isFalse(getFlags().isCarry());
    });

    it('sets half carry on sub, whenever one borrows from bit 4', () => {
      const valInA = 0b00010000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, 0x01);

      Z80.alu8.sub(state, state.map.c);
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('does not set half carry on sub, when there clearly has not been a borrow', () => {
      const valInA = 0b00010001;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, 0x01);

      Z80.alu8.sub(state, state.map.c);
      assert.isFalse(getFlags().isHalfCarry());
    });

    it('sets half carry on sub, also with a bigger borrow', () => {
      const valInA = 0b00110011;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, 0x04);

      Z80.alu8.sub(state, state.map.c);
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('sets zero flag if result is zero when doing compare', () => {
      const valInA = 10;
      const valInB = 10;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);

      Z80.alu8.cp(state, state.map.b);

      const flags = getFlags();
      assert.isTrue(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isFalse(flags.isCarry());
    });


    it('sets carry flag if there is borrow', () => {
      const valInA = 10;
      const valInB = 14;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);

      Z80.alu8.cp(state, state.map.b);

      const flags = getFlags();
      assert.isFalse(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isTrue(flags.isCarry());
    });

    it('sets half carry flag if there is borrow from bit 4', () => {
      const valInA = 0b0010000;
      const valInB = 0b0000001;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);

      Z80.alu8.cp(state, state.map.b);

      const flags = getFlags();
      assert.isFalse(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isTrue(flags.isHalfCarry());
      assert.isFalse(flags.isCarry());
    });
  });
});

import { assert } from 'chai';
import { it, beforeEach, describe } from 'mocha';
import { Z80, CheckFlagFor } from '../../../src/gameboy/processor/index.js';
import getEmptyState from '../../helper/state-helper.js';

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

  describe('Alu 8 bit - instruction set tests', () => {
    it('can add a register and A', () => {
      reg.b(0x04);
      reg.a(0x02);

      Z80.alu8.add(state, reg.b);

      assert.equal(reg.a(), 0x06);
    });

    it('can add A and A', () => {
      reg.a(0x10);

      Z80.alu8.add(state, reg.a);

      assert.equal(reg.a(), 0x10 + 0x10);
    });

    it('sets flags when doing addition', () => {
      reg.a(0xFF);
      reg.c(0x01);

      Z80.alu8.add(state, reg.c);
      assert.equal(reg.f(), 0b10110000);

      reg.c(0x10);
      Z80.alu8.add(state, reg.c);
      assert.equal(reg.f(), 0b00000000);
    });

    it('adds value found at addr HL with reg A', () => {
      reg.a(0x01);
      mmu.writeByte(0xA220, 0x03);
      reg.hl(0xA220);

      Z80.alu8.addMemHL(state);

      assert.equal(reg.f(), 0);
      assert.equal(reg.a(), 0x04);
    });

    it('can take immediate value and add with reg A', () => {
      reg.a(0xF0);
      reg.pc(0xB200);
      mmu.writeByte(0xB200, 0x01);

      Z80.alu8.addImmediate(state);

      assert.equal(reg.a(), 0xF1);
      assert.equal(reg.f(), 0);
      assert.isAbove(reg.pc(), 0xB200);
    });

    it('can sum A and a reg + carry flag', () => {
      reg.a(0x10);
      reg.d(0x01);
      reg.f(0b00010000);
      Z80.alu8.adcPlusCarry(state, reg.d);
      const val = reg.a();

      reg.a(0x10);
      reg.f(0b00000000);
      Z80.alu8.adcPlusCarry(state, reg.d);
      const val2 = reg.a();
      assert.notEqual(val, val2);
      assert.equal(val, 0x10 + 0x01 + 1);
    });

    it('can sum value in mem with reg + carry flag', () => {
      reg.a(0x1);
      mmu.writeByte(0xA222, 0x01);
      reg.hl(0xA222);
      reg.f(0b00010000);

      Z80.alu8.adcMemHLPlusCarry(state);

      assert.equal(reg.a(), 3);
    });

    it('can sum immediate value with A + carry flag', () => {
      const nextInMem = 0xA223;
      const immediateVal = 0x23;
      const valInA = 0x10;
      reg.a(valInA);
      reg.pc(nextInMem);
      mmu.writeByte(nextInMem, immediateVal);
      reg.f(0b00010000);

      Z80.alu8.adcImmediatePlusCarry(state);

      assert.equal(reg.a(), immediateVal + valInA + 1);
      assert.equal(reg.pc(), nextInMem + 1);
    });

    it('can subtract a from any 8 bit reg', () => {
      const valInA = 0xAA;
      reg.a(valInA);
      reg.b(0x11);
      reg.c(0x22);

      Z80.alu8.sub(state, reg.b);
      assert.equal(reg.a(), valInA - 0x11);

      Z80.alu8.sub(state, reg.c);
      assert.equal(reg.a(), valInA - 0x11 - 0x22);
    });

    it('sets zero flags when subtracting', () => {
      const valInA = 0xAA;
      reg.a(valInA);

      Z80.alu8.sub(state, reg.a);
      assert.isTrue(getFlags().isZero());
    });

    it('sets subtraction flag when subtracting', () => {
      const valInA = 0xAA;
      reg.a(valInA);

      Z80.alu8.sub(state, reg.b);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can subtract val from mem with A', () => {
      const valInA = 0xDD;
      const memAddr = 0x9555;
      const memVal = 0x44;
      reg.a(valInA);
      reg.hl(memAddr);
      mmu.writeByte(memAddr, memVal);

      Z80.alu8.subMemHL(state);

      assert.equal(reg.a(), valInA - memVal);
      const flag = getFlags();
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract immediate from A', () => {
      const valInA = 0xEE;
      const pcMemAddr = 0x9662;
      const memVal = 0x59;
      reg.a(valInA);
      reg.pc(pcMemAddr);
      mmu.writeByte(pcMemAddr, memVal);

      Z80.alu8.subImmediate(state);

      assert.equal(reg.a(), valInA - memVal);
      const flag = getFlags();
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract reg plus carry from A', () => {
      const valInA = 0xBE;
      const valInB = 0x99;
      reg.a(valInA);
      reg.b(valInB);
      reg.f(0b00010000);

      Z80.alu8.sbc(state, reg.b);

      assert.equal(reg.a(), valInA - valInB - 1);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can subtract Mem HL plus carry from A', () => {
      const valInA = 0xBE;
      const memAddr = 0x9555;
      const memVal = 0x44;
      reg.hl(memAddr);
      mmu.writeByte(memAddr, memVal);
      reg.a(valInA);
      reg.f(0b00010000);

      Z80.alu8.sbcMemHL(state);

      assert.equal(reg.a(), valInA - memVal - 1);
      assert.isTrue(getFlags().isSubtraction());
    });

    it('can take the logical and of a reg and A', () => {
      const valInA = 0b10001000;
      const valInB = 0b00001000;
      reg.a(valInA);
      reg.b(valInB);

      Z80.alu8.and(state, reg.b);

      assert.equal(reg.a(), 0b00001000);
      assert.equal(reg.f(), 0b00100000);
    });

    it('takes logical and of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0xB645;
      reg.a(valInA);
      reg.hl(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.andMemHL(state);

      assert.equal(reg.a(), 0b00011000);
    });

    it('takes logical and of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0xB645;
      reg.a(valInA);
      reg.pc(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.andImmediate(state);

      assert.equal(reg.a(), 0b00000010);
    });

    it('can take the logical or of a reg and A', () => {
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      reg.a(valInA);
      reg.c(valInC);

      Z80.alu8.or(state, reg.c);

      assert.equal(reg.a(), 0b10001000);
      assert.equal(reg.f(), 0b00000000);
    });

    it('takes logical or of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0x9645;
      reg.a(valInA);
      reg.hl(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.orMemHL(state);

      assert.equal(reg.a(), 0b00011100);
    });

    it('takes logical or of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0x9645;
      reg.a(valInA);
      reg.pc(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.orImmediate(state);

      assert.equal(reg.a(), 0b10000011);
    });

    it('can take the logical xor of a reg and A', () => {
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      reg.a(valInA);
      reg.c(valInC);
      Z80.alu8.xor(state, reg.c);

      assert.equal(reg.a(), 0b10000000);
      assert.equal(reg.f(), 0b00000000);
    });

    it('takes logical xor of mem HL and A', () => {
      const valInA = 0b00011000;
      const valInMem = 0b00011100;
      const memAddr = 0x9645;
      reg.a(valInA);
      reg.hl(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.xorMemHL(state);

      assert.equal(reg.a(), 0b00000100);
    });

    it('takes logical xor of immediate and A', () => {
      const valInA = 0b10000011;
      const valInMem = 0b00000010;
      const memAddr = 0xC645;
      reg.a(valInA);
      reg.pc(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.xorImmediate(state);

      assert.equal(reg.a(), 0b10000001);
    });

    it('compare reg with A and set flags', () => {
      const valInA = 0x15;
      const valInD = 0x15;
      const valInL = 0x14;
      reg.a(valInA);
      reg.d(valInD);
      reg.l(valInL);

      Z80.alu8.cp(state, reg.d);
      const flag1 = getFlags();
      assert.isTrue(flag1.isZero());
      assert.isTrue(flag1.isSubtraction());

      Z80.alu8.cp(state, reg.l);
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
      reg.a(valInA);
      reg.hl(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.cpMemHL(state);

      assert.equal(reg.f(), 0b01000000);
    });

    it('takes logical xor of immediate and A', () => {
      const valInA = 0x20;
      const valInMem = 0x80;
      const memAddr = 0xA644;
      reg.a(valInA);
      reg.pc(memAddr);
      mmu.writeByte(memAddr, valInMem);

      Z80.alu8.cpImmediate(state);

      assert.equal(reg.f(), 0b01010000);
    });

    it('can increment a register', () => {
      const valInD = 0x51;
      reg.d(valInD);

      Z80.alu8.inc(state, reg.d);

      assert.equal(valInD + 1, reg.d());
    });

    it('can decrement a register', () => {
      const valInC = 0x21;
      reg.c(valInC);

      Z80.alu8.dec(state, reg.c);

      assert.equal(valInC - 1, reg.c());
      assert.equal(0, reg.a());
    });

    it('sets zero flag on increment', () => {
      const valInD = -1;
      reg.d(valInD);

      Z80.alu8.inc(state, reg.d);
      const flags = getFlags();
      assert.isTrue(flags.isZero());
    });

    it('reset subtraction flag and keep prev carry flag on increment', () => {
      const valInD = 0x02;
      reg.d(valInD);
      reg.f(0b01010000);

      Z80.alu8.inc(state, reg.d);
      const flags = getFlags();
      assert.isTrue(flags.isCarry());
      assert.isFalse(flags.isSubtraction());
    });

    it('checks zero, sets subtraction and keeps previous carry on decrement', () => {
      const valInD = 0x01;
      reg.d(valInD);
      reg.f(0b00010000);

      Z80.alu8.dec(state, reg.d);
      const flags = getFlags();
      assert.isTrue(flags.isCarry());
      assert.isTrue(flags.isZero());
      assert.isTrue(flags.isSubtraction());
    });

    it('increments value in memAddr found in HL', () => {
      const memAddrInHL = 0xD342;
      const valueInMem = 0x54;
      reg.hl(memAddrInHL);
      mmu.writeByte(memAddrInHL, valueInMem);

      Z80.alu8.incMemHL(state);

      assert.equal(valueInMem + 1, mmu.readByte(memAddrInHL));
    });

    it('decrements value in mem with addr found in HL', () => {
      const memAddrInHL = 0xC342;
      const valueInMem = 0x55;
      reg.hl(memAddrInHL);
      mmu.writeByte(memAddrInHL, valueInMem);

      Z80.alu8.decMemHL(state);

      assert.equal(valueInMem - 1, mmu.readByte(memAddrInHL));
    });

    it('should set half carry flag if there was a borrow from bit 4 to bit 3', () => {
      const willCauseHalfCarry = 0b00010000;
      reg.b(willCauseHalfCarry);

      Z80.alu8.dec(state, reg.b);

      assert.isTrue(getFlags().isHalfCarry());

      const notCarry = 0b00001111;
      reg.b(notCarry);

      Z80.alu8.dec(state, reg.b);

      assert.isFalse(getFlags().isHalfCarry());

      const notCarry2 = 0b00010001;
      reg.b(notCarry2);

      Z80.alu8.dec(state, reg.b);

      assert.isFalse(getFlags().isHalfCarry());
    });

    it('set borrow flag on subtraction which result in borrow', () => {
      const valInA = 0x09;
      reg.a(valInA);
      reg.b(0x10);

      Z80.alu8.sub(state, reg.b);
      assert.isTrue(getFlags().isCarry());
    });

    it('does not set carry borrow if A is bigger than what we subtract', () => {
      const valInA = 0xAA;
      reg.a(valInA);
      reg.c(0x10);

      Z80.alu8.sub(state, reg.c);
      assert.isFalse(getFlags().isCarry());
    });

    it('sets half carry on sub, whenever one borrows from bit 4', () => {
      const valInA = 0b00010000;
      reg.a(valInA);
      reg.c(0x01);

      Z80.alu8.sub(state, reg.c);
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('does not set half carry on sub, when there clearly has not been a borrow', () => {
      const valInA = 0b00010001;
      reg.a(valInA);
      reg.c(0x01);

      Z80.alu8.sub(state, reg.c);
      assert.isFalse(getFlags().isHalfCarry());
    });

    it('sets half carry on sub, also with a bigger borrow', () => {
      const valInA = 0b00110011;
      reg.a(valInA);
      reg.c(0x04);

      Z80.alu8.sub(state, reg.c);
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('sets zero flag if result is zero when doing compare', () => {
      const valInA = 10;
      const valInB = 10;
      reg.a(valInA);
      reg.b(valInB);

      Z80.alu8.cp(state, reg.b);

      const flags = getFlags();
      assert.isTrue(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isFalse(flags.isCarry());
    });


    it('sets carry flag if there is borrow', () => {
      const valInA = 10;
      const valInB = 14;
      reg.a(valInA);
      reg.b(valInB);

      Z80.alu8.cp(state, reg.b);

      const flags = getFlags();
      assert.isFalse(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isTrue(flags.isCarry());
    });

    it('sets half carry flag if there is borrow from bit 4', () => {
      const valInA = 0b0010000;
      const valInB = 0b0000001;
      reg.a(valInA);
      reg.b(valInB);

      Z80.alu8.cp(state, reg.b);

      const flags = getFlags();
      assert.isFalse(flags.isZero());
      assert.isTrue(flags.isSubtraction());
      assert.isTrue(flags.isHalfCarry());
      assert.isFalse(flags.isCarry());
    });

    // it('should handle specific blargg case', () => {
    //   reg.a(0x22);
    //   reg.pc(0xC503 + 1);
    //   mmu.writeByte(0xC504, 0x2B);

    //   Z80.alu8.cpImmediate(state);

    //   assert.equal(reg.f(), 0x50);
    // });
  });
});

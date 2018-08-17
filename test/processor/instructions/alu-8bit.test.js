import { assert } from 'chai';
import { Z80, RegMap, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';
import { it } from 'mocha';

/* eslint newline-per-chained-call: 0 */
/* eslint object-curly-newline: 0 */
describe('Processor', () => {
  describe('Alu 8 bit - instruction set tests', () => {
    it('can add a register and A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.b, 0x04);
      state.reg.reg(RegMap.a, 0x02);

      Z80.alu8.add(state, RegMap.b);

      assert.equal(state.reg.reg(RegMap.a), 0x06);
    });

    it('can add A and A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x10);

      Z80.alu8.add(state, RegMap.a);

      assert.equal(state.reg.reg(RegMap.a), 0x10 + 0x10);
    });

    it('sets flags when doing addition', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0xFF);
      state.reg.reg(RegMap.c, 0x01);

      Z80.alu8.add(state, RegMap.c);
      assert.equal(state.reg.flags(), 0b10110000);
    });

    it('adds value found at addr HL with reg A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x01);
      state.mmu.writeByte(0x1220, 0x03);
      state.reg.reg(RegMap.hl, 0x1220);

      Z80.alu8.addMemHL(state);

      assert.equal(state.reg.flags(), 0);
      assert.equal(state.reg.reg(RegMap.a), 0x04);
    });

    it('can take immediate value and add with reg A', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0xF0);
      state.reg.pc(0x3200);
      state.mmu.writeByte(0x3200, 0x01);

      Z80.alu8.addImmediate(state);

      assert.equal(state.reg.reg(RegMap.a), 0xF1);
      assert.isAbove(state.reg.flags(), 0);
      assert.isAbove(state.reg.pc(), 0x3200);
    });

    it('can sum A and a reg + carry flag', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x10);
      state.reg.reg(RegMap.d, 0x01);
      state.reg.reg(RegMap.f, 0b00010000);
      Z80.alu8.adcPlusCarry(state, RegMap.d);
      const val = state.reg.reg(RegMap.a);

      state.reg.reg(RegMap.a, 0x10);
      state.reg.reg(RegMap.f, 0b00000000);
      Z80.alu8.adcPlusCarry(state, RegMap.d);
      const val2 = state.reg.reg(RegMap.a);
      assert.notEqual(val, val2);
      assert.equal(val, 0x10 + 0x01 + 1);
    });

    it('can sum value in mem with reg + carry flag', () => {
      const state = getEmptyState();
      state.reg.reg(RegMap.a, 0x1);
      state.mmu.writeByte(0x2222, 0x01);
      state.reg.reg(RegMap.hl, 0x2222);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.adcMemHLPlusCarry(state);
      const val = state.reg.reg(RegMap.a);

      assert.equal(val, 3);
    });

    it('can sum immediate value with A + carry flag', () => {
      const state = getEmptyState();
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
      const state = getEmptyState();
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, 0x11);
      state.reg.reg(RegMap.c, 0x22);

      Z80.alu8.sub(state, RegMap.b);
      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - 0x11);

      Z80.alu8.sub(state, RegMap.c);
      const val2 = state.reg.reg(RegMap.a);
      assert.equal(val2, valInA - 0x11 - 0x22);
    });

    it('sets zero flags when subtracting', () => {
      const state = getEmptyState();
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);

      Z80.alu8.sub(state, RegMap.a);
      assert.isTrue(new CheckFlagFor(state.reg.flags()).isZero());
    });

    it('sets subtraction flag when subtracting', () => {
      const state = getEmptyState();
      const valInA = 0xAA;
      state.reg.reg(RegMap.a, valInA);

      Z80.alu8.sub(state, RegMap.b);
      assert.isTrue(new CheckFlagFor(state.reg.flags()).isSubtraction());
    });

    it('can subtract val from mem with A', () => {
      const state = getEmptyState();
      const valInA = 0xDD;
      const memAddr = 0x5555;
      const memVal = 0x44;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.hl, memAddr);
      state.mmu.writeByte(memAddr, memVal);

      Z80.alu8.subMemHL(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - memVal);
      const flag = new CheckFlagFor(state.reg.flags());
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract immediate from A', () => {
      const state = getEmptyState();
      const valInA = 0xEE;
      const pcMemAddr = 0x6662;
      const memVal = 0x59;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(pcMemAddr);
      state.mmu.writeByte(pcMemAddr, memVal);

      Z80.alu8.subImmediate(state);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - memVal);
      const flag = new CheckFlagFor(state.reg.flags());
      assert.isTrue(flag.isSubtraction());
      assert.isNotTrue(flag.zero());
    });

    it('can subtract reg plus carry from A', () => {
      const state = getEmptyState();
      const valInA = 0xBE;
      const valInB = 0x99;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);
      state.reg.reg(RegMap.f, 0b00010000);

      Z80.alu8.sbc(state, RegMap.b);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, valInA - valInB - 1);
      assert.isTrue(new CheckFlagFor(state.reg.flags()).isSubtraction());
    });

    it('can subtract Mem HL plus carry from A', () => {
      const state = getEmptyState();
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
      assert.isTrue(new CheckFlagFor(state.reg.flags()).isSubtraction());
    });

    it('can take the logical and of a reg and A', () => {
      const state = getEmptyState();
      const valInA = 0b10001000;
      const valInB = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.b, valInB);

      Z80.alu8.and(state, RegMap.b);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b00001000);
      assert.equal(state.reg.flags(), 0b00100000);
    });

    it('takes logical and of mem HL and A', () => {
      const state = getEmptyState();
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
      const state = getEmptyState();
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
      const state = getEmptyState();
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, valInC);

      Z80.alu8.or(state, RegMap.c);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10001000);
      assert.equal(state.reg.flags(), 0b00000000);
    });

    it('takes logical or of mem HL and A', () => {
      const state = getEmptyState();
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
      const state = getEmptyState();
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
      const state = getEmptyState();
      const valInA = 0b10001000;
      const valInC = 0b00001000;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.c, valInC);
      Z80.alu8.xor(state, RegMap.c);

      const val = state.reg.reg(RegMap.a);
      assert.equal(val, 0b10000000);
      assert.equal(state.reg.flags(), 0b00000000);
    });

    it('takes logical xor of mem HL and A', () => {
      const state = getEmptyState();
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
      const state = getEmptyState();
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
      // TODO: test cp borrow and subtraction borrow
      const state = getEmptyState();
      const valInA = 0x15;
      const valInD = 0x15;
      const valInL = 0x14;
      state.reg.reg(RegMap.a, valInA);
      state.reg.reg(RegMap.d, valInD);
      state.reg.reg(RegMap.l, valInL);

      Z80.alu8.cp(state, RegMap.d);
      const flag1 = new CheckFlagFor(state.reg.flags());
      assert.isTrue(flag1.isZero());
      assert.isTrue(flag1.isSubtraction());

      Z80.alu8.cp(state, RegMap.l);
      const flag2 = new CheckFlagFor(state.reg.flags());
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
      const state = getEmptyState();
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
      const state = getEmptyState();
      const valInA = 0x20;
      const valInMem = 0x80;
      const memAddr = 0x7644;
      state.reg.reg(RegMap.a, valInA);
      state.reg.pc(memAddr);
      state.mmu.writeByte(memAddr, valInMem);

      Z80.alu8.cpImmediate(state);

      const val = state.reg.flags();
      // TODO: underflow, borrow?? what what
      assert.equal(val, 0b01010000);
    });
  });
});

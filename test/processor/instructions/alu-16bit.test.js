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

  describe('Alu 16 bit - instruction set tests', () => {
    it('can increment a register', () => {
      reg.bc(100);

      Z80.alu16.inc(state, reg.bc);
      assert.equal(reg.bc(), 101);
    });

    it('can decrement a register', () => {
      reg.hl(52);

      Z80.alu16.dec(state, reg.hl);
      assert.equal(reg.hl(), 51);
    });

    it('can decrement a stack pointer', () => {
      reg.sp(172);

      Z80.alu16.dec(state, reg.sp);
      assert.equal(reg.sp(), 171);
    });

    it('can add 16 bit registers', () => {
      const valInHL = 0x5543;
      const valInDE = 0x1000;
      reg.hl(valInHL);
      reg.de(valInDE);

      Z80.alu16.addRegHLReg(state, reg.de);

      assert.equal(valInHL + valInDE, reg.hl());
    });

    it('adds HL with HL with no problem', () => {
      const valInHL = 0x5543;
      reg.hl(valInHL);

      Z80.alu16.addRegHLReg(state, reg.hl);

      assert.equal(valInHL * 2, reg.hl());
    });

    it('sets carry correctly on 16 bit add', () => {
      const valInHL = 0xFFFF;
      const valInDE = 0x0001;
      reg.hl(valInHL);
      reg.de(valInDE);

      Z80.alu16.addRegHLReg(state, reg.de);

      assert.equal(0, reg.hl());
      assert.isTrue(getFlags().isHalfCarry());
      assert.isTrue(getFlags().isCarry());
    });

    it('sets half-carry correctly on 16 bit add', () => {
      const valInHL = 0b0000111111111111;
      const valInDE = 0x01;
      reg.hl(valInHL);
      reg.de(valInDE);

      Z80.alu16.addRegHLReg(state, reg.de);

      assert.isFalse(getFlags().isCarry());
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('zero flag is unaffected and subtraction reset on 16 bit add', () => {
      const valInHL = 0x0001; // Carry and halfcarry
      reg.f(0b11000000);
      reg.hl(valInHL);

      Z80.alu16.addRegHLReg(state, reg.hl);

      assert.equal(2, reg.hl());
      const flags = getFlags();
      assert.isFalse(flags.isCarry());
      assert.isFalse(flags.isSubtraction());
      assert.isFalse(flags.isHalfCarry());
      assert.isTrue(flags.isZero());
    });

    it('adds immediate to stack pointer', () => {
      const pcVal = 0x9342;
      const valueInMem = 0x54;
      const spVal = 0x02;
      reg.pc(pcVal);
      reg.sp(spVal);
      mmu.writeByte(pcVal, valueInMem);

      Z80.alu16.addRegSPImmediate(state);

      assert.equal(valueInMem + spVal, reg.sp());
    });

    it('checks carry and half carry on add immediate to SP', () => {
      const pcVal = 0x9342;
      const valueInMem = 0x7F;
      const spVal = 0xFF81;
      reg.pc(pcVal);
      reg.sp(spVal);
      mmu.writeByte(pcVal, valueInMem);

      Z80.alu16.addRegSPImmediate(state);
      assert.equal(0, reg.sp());
      assert.isTrue(getFlags().isCarry());

      assert.isTrue(getFlags().isHalfCarry());
    });
  });
});

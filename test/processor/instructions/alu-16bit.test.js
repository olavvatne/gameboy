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

  describe('Alu 16 bit - instruction set tests', () => {
    it('can increment a register', () => {
      state.reg.reg(RegMap.bc, 100);

      Z80.alu16.inc(state, RegMap.bc);
      assert.equal(state.reg.reg(RegMap.bc), 101);
    });

    it('can decrement a register', () => {
      state.reg.reg(RegMap.hl, 52);

      Z80.alu16.dec(state, RegMap.hl);
      assert.equal(state.reg.reg(RegMap.hl), 51);
    });

    it('can decrement a stack pointer', () => {
      state.reg.reg(RegMap.sp, 172);

      Z80.alu16.dec(state, RegMap.sp);
      assert.equal(state.reg.reg(RegMap.sp), 171);
    });

    it('can add 16 bit registers', () => {
      const valInHL = 0x5543;
      const valInDE = 0x1000;
      state.reg.reg(RegMap.hl, valInHL);
      state.reg.reg(RegMap.de, valInDE);

      Z80.alu16.addRegHLReg(state, RegMap.de);

      assert.equal(valInHL + valInDE, state.reg.reg(RegMap.hl));
    });

    it('adds HL with HL with no problem', () => {
      const valInHL = 0x5543;
      state.reg.reg(RegMap.hl, valInHL);

      Z80.alu16.addRegHLReg(state, RegMap.hl);

      assert.equal(valInHL * 2, state.reg.reg(RegMap.hl));
    });

    it('sets carry correctly on 16 bit add', () => {
      const valInHL = 0xFFFF;
      const valInDE = 0x0001;
      state.reg.reg(RegMap.hl, valInHL);
      state.reg.reg(RegMap.de, valInDE);

      Z80.alu16.addRegHLReg(state, RegMap.de);

      assert.equal(0, state.reg.reg(RegMap.hl));
      // TODO: should halfCarry only be set in case of overflow, or as long
      // as value is above threshold?
      assert.isTrue(getFlags().isHalfCarry());
      assert.isTrue(getFlags().isCarry());
    });

    it('sets half-carry correctly on 16 bit add', () => {
      const valInHL = 0b0000111111111111;
      const valInDE = 0x01;
      state.reg.reg(RegMap.hl, valInHL);
      state.reg.reg(RegMap.de, valInDE);

      Z80.alu16.addRegHLReg(state, RegMap.de);

      assert.isFalse(getFlags().isCarry());
      assert.isTrue(getFlags().isHalfCarry());
    });

    it('zero flag is unaffected and subtraction reset on 16 bit add', () => {
      const valInHL = 0x0001; // Carry and halfcarry
      state.reg.reg(RegMap.f, 0b11000000);
      state.reg.reg(RegMap.hl, valInHL);

      Z80.alu16.addRegHLReg(state, RegMap.hl);

      assert.equal(2, state.reg.reg(RegMap.hl));
      const flags = getFlags();
      assert.isFalse(flags.isCarry());
      assert.isFalse(flags.isSubtraction());
      assert.isFalse(flags.isHalfCarry());
      assert.isTrue(flags.isZero());
    });

    it('adds immediate to stack pointer', () => {
      const pcVal = 0x4342;
      const valueInMem = 0x54;
      const spVal = 0x02;
      state.reg.pc(pcVal);
      state.reg.sp(spVal);
      state.mmu.writeByte(pcVal, valueInMem);

      Z80.alu16.addRegSPImmediate(state);

      assert.equal(valueInMem + spVal, state.reg.sp());
    });

    it('checks carry and half carry on add immediate to SP', () => {
      const pcVal = 0x4342;
      const valueInMem = 0xFF;
      const spVal = 0xFF01;
      state.reg.pc(pcVal);
      state.reg.sp(spVal);
      state.mmu.writeByte(pcVal, valueInMem);

      Z80.alu16.addRegSPImmediate(state);
      // TODO: 16 bit carry and half carry
      assert.equal(0, state.reg.sp());
      assert.isTrue(getFlags().isCarry());
      assert.isTrue(getFlags().isHalfCarry());
    });
  });
});

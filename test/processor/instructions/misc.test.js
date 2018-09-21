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

  describe('Misc - instruction set tests', () => {
    it('can swap upper and lower nibble', () => {
      const correctSwapped = 0b01101001;
      state.reg.reg(RegMap.b, 0b10010110);

      Z80.misc.swap(state, state.map.b);

      assert.equal(state.reg.reg(RegMap.b), correctSwapped);
    });
  });

  it('swap nibbles in memory address found in HL', () => {
    const correctSwapped = 0b01111110;
    const memAddr = 0x1000;
    state.mmu.writeByte(memAddr, 0b11100111);
    state.reg.reg(RegMap.hl, memAddr);

    Z80.misc.swapMemHL(state);

    assert.equal(state.mmu.readByte(memAddr), correctSwapped);
  });

  it('can flip accumulator', () => {
    const correctlyFlipped = 0b00110101;
    state.reg.reg(RegMap.a, 0b11001010);
    state.reg.reg(RegMap.f, 0b11110000);

    Z80.misc.cpl(state);

    const val = state.reg.reg(RegMap.a);
    assert.equal(val, correctlyFlipped);
    const flag = getFlags();
    assert.isTrue(flag.isHalfCarry());
    assert.isTrue(flag.isSubtraction());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry()); // unaffected
  });

  it('can flip accumulator', () => {
    state.reg.reg(RegMap.f, 0b11100000);

    Z80.misc.ccf(state);

    let flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isFalse(flag.isSubtraction());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry());

    Z80.misc.ccf(state);

    flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isFalse(flag.isCarry());
  });

  it('can complement the carry flag', () => {
    state.reg.reg(RegMap.f, 0b11100000);

    Z80.misc.ccf(state);

    let flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isFalse(flag.isSubtraction());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry());

    Z80.misc.ccf(state);

    flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isFalse(flag.isCarry());
  });

  it('can set the carry flag', () => {
    state.reg.reg(RegMap.f, 0b11100000);

    Z80.misc.scf(state);

    let flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isFalse(flag.isSubtraction());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry());

    Z80.misc.scf(state);

    flag = getFlags();
    assert.isFalse(flag.isHalfCarry());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry());
  });

  it('can correct A containing bcd into correct packed BCD representation', () => {
    // BCD addition of something that lead to 99. No correction needed
    const num = 0b10011001; // 99
    const corrBcd = 0b10011001;
    state.reg.reg(RegMap.a, num);

    Z80.misc.daa(state);

    const bcdNum = state.reg.reg(RegMap.a);

    assert.equal(bcdNum, corrBcd);
  });

  it('can correct A containing bcd into correct bcd with other number', () => {
    // Addition. 19 + 28 = 47
    // 0001 1001 => 19
    // 0010 1000 => 28
    const num = 0b01000001; // 4 and 1. Not correctly adjusted
    const corrBcd = 0b01000111; // 47 in bcd
    // We have a half carry here from previous operation
    const flag = new CheckFlagFor().setHalfCarry(true).get();
    state.reg.reg(RegMap.a, num);
    state.reg.reg(RegMap.f, flag);

    Z80.misc.daa(state);

    const bcdNum = state.reg.reg(RegMap.a);

    assert.equal(bcdNum, corrBcd);
  });

  it('can correct A containing bcd into correct bcd with third number', () => {
    const num = 0b00001010; // 10
    const corrBcd = 0b00010000; // 1 - 0
    state.reg.reg(RegMap.a, num);

    Z80.misc.daa(state);

    const bcdNum = state.reg.reg(RegMap.a);

    assert.equal(bcdNum, corrBcd);
  });

  it('handles correction of bcd reg A after subtraction', () => {
    // 47 - 28 = 19
    // 0010 1000 => 28
    // 0100 0111 => 47
    // 1101 1000 => two's complement of 28
    // 0001 1111 => 1 and 15. Not bcd 19
    const num = 0b00011111;
    const corrBcd = 0b00011001; // 1 - 9
    const flag = new CheckFlagFor().setCarry(true).subtraction().get();
    state.reg.reg(RegMap.a, num);
    state.reg.reg(RegMap.f, flag);

    Z80.misc.daa(state);

    const bcdNum = state.reg.reg(RegMap.a);

    assert.equal(bcdNum, corrBcd);
  });
});

import { assert } from 'chai';
import { it, beforeEach } from 'mocha';
import { Z80, CheckFlagFor } from '../../../src/gameboy/processor';
import getEmptyState from '../../helper/state-helper';

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

  describe('Misc - instruction set tests', () => {
    it('can swap upper and lower nibble', () => {
      const correctSwapped = 0b01101001;
      reg.b(0b10010110);

      Z80.misc.swap(state, reg.b);

      assert.equal(reg.b(), correctSwapped);
    });
  });

  it('swap nibbles in memory address found in HL', () => {
    const correctSwapped = 0b01111110;
    const memAddr = 0xA000;
    mmu.writeByte(memAddr, 0b11100111);
    reg.hl(memAddr);

    Z80.misc.swapMemHL(state);

    assert.equal(mmu.readByte(memAddr), correctSwapped);
  });

  it('can flip accumulator', () => {
    const correctlyFlipped = 0b00110101;
    reg.a(0b11001010);
    reg.f(0b11110000);

    Z80.misc.cpl(state);

    assert.equal(reg.a(), correctlyFlipped);
    const flag = getFlags();
    assert.isTrue(flag.isHalfCarry());
    assert.isTrue(flag.isSubtraction());
    assert.isTrue(flag.isZero()); // unaffected
    assert.isTrue(flag.isCarry()); // unaffected
  });

  it('can flip accumulator', () => {
    reg.f(0b11100000);

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
    reg.f(0b11100000);

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
    reg.f(0b11100000);

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
    reg.a(num);

    Z80.misc.daa(state);

    const bcdNum = reg.a();

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
    reg.a(num);
    reg.f(flag);

    Z80.misc.daa(state);

    const bcdNum = reg.a();

    assert.equal(bcdNum, corrBcd);
  });

  it('can correct A containing bcd into correct bcd with third number', () => {
    const num = 0b00001010; // 10
    const corrBcd = 0b00010000; // 1 - 0
    reg.a(num);

    Z80.misc.daa(state);

    const bcdNum = reg.a();

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
    const flag = new CheckFlagFor().setHalfCarry(true).subtraction().get();
    reg.a(num);
    reg.f(flag);

    Z80.misc.daa(state);

    const bcdNum = reg.a();

    assert.equal(bcdNum, corrBcd);
  });

  it('should handle this blargg DAA case', () => {
    reg.a(0x60);
    reg.b(0x12);
    reg.c(0x00);
    reg.d(0x60);
    reg.e(0xd0);
    reg.f(0xd0);
    reg.h(0xff);
    reg.l(0x50);

    Z80.misc.daa(state);
    assert.equal(reg.a(), 0x00);
    assert.equal(reg.b(), 0x12);
    assert.equal(reg.c(), 0x00);
    assert.equal(reg.d(), 0x60);
    assert.equal(reg.f(), 0xd0);
  });

  it('handles another blargg DAA edge case', () => {
    reg.a(0x67);
    reg.b(0x12);
    reg.c(0x00);
    reg.d(0x67);
    reg.e(0xF0);
    reg.f(0xF0);
    reg.h(0x00);
    reg.l(0xd0);

    Z80.misc.daa(state);
    assert.equal(reg.a(), 0x01);
    assert.equal(reg.b(), 0x12);
    assert.equal(reg.c(), 0x00);
    assert.equal(reg.d(), 0x67);
    assert.equal(reg.f(), 0x50);
  });
});

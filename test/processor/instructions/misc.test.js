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

      Z80.misc.swap(state, RegMap.b);

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
});

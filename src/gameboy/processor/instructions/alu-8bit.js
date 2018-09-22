import { CheckFlagFor } from '../';
import { alu16 } from './';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

const setSubtractionFlag = (map, val, minuend) => {
  const flag = new CheckFlagFor().zero(val).subtraction()
    .carryBorrow(val).halfCarryBorrow(val, minuend).get();
  map.f(flag);
};

const readImmediateValueAndIncrementPC = (map, mmu) => {
  const pc = map.pc();
  const immediateValue = mmu.readByte(pc);
  map.pc(pc + 1);
  return immediateValue;
};

const readValFromHLMem = (map, mmu) => {
  const memAddr = map.hl();
  return mmu.readByte(memAddr);
};

const setLogicalAndFlag = (map, val) => {
  const flag = new CheckFlagFor().zero(val).setHalfCarry(true).get();
  map.f(flag);
};

const setLogicalOrFlag = (map, val) => {
  const flag = new CheckFlagFor().zero(val).get();
  map.f(flag);
};

const setFlagsOnCompare = (map, val) => {
  const valInA = map.a();
  const flag = new CheckFlagFor().subtraction().zero(val)
    .underflow(val).halfCarryBorrow(val, valInA).get();
  map.f(flag);
};

const setFlagsOnInc = (map, val) => {
  const prevFlag = map.f();
  const isH = (val & 0x0F) === 0; // inc by one. if lower nibble 0000, a half carry has occured.
  const flag = new CheckFlagFor(prevFlag).zero(val).notSubtraction().setHalfCarry(isH).get();
  map.f(flag);
};

const setFlagsOnDec = (map, val) => {
  const prevFlag = map.f();
  // Only way to borrow. -1 each time. From 0001 000 -> 0000 111
  const isH = (val & 0x0F) === 0x0F;
  const flag = new CheckFlagFor(prevFlag).zero(val).subtraction().setHalfCarry(isH).get();
  map.f(flag);
};

export default {

  // ADDITION
  add: ({ map }, regX) => {
    const val = map.a() + regX();
    const flag = new CheckFlagFor().zero(val).carry(val).halfCarry(val).get();
    map.f(flag);
    map.a(val);
    return createOpTime(1, 4);
  },

  addMemHL: ({ mmu, map }) => {
    const valFromMem = readValFromHLMem(map, mmu);
    const sum = valFromMem + map.a();
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcMemHLPlusCarry: ({ mmu, map }) => {
    const valFromMem = readValFromHLMem(map, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = valFromMem + map.a() + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcImmediatePlusCarry: ({ mmu, map }) => {
    const immediateValue = readImmediateValueAndIncrementPC(map, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = immediateValue + map.a() + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  addImmediate: ({ mmu, map }) => {
    const imVal = readImmediateValueAndIncrementPC(map, mmu);
    const sum = imVal + map.a();
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcPlusCarry: ({ map }, regX) => {
    const val = map.a() + regX();
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = val + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  // SUBTRACTION
  sub: ({ map }, regX) => {
    const regA = map.a();
    const val = regA - regX();
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, regA);
    return createOpTime(1, 4);
  },

  subMemHL: ({ mmu, map }) => {
    const regA = map.a();
    const val = regA - readValFromHLMem(map, mmu);
    map.a(val);
    setSubtractionFlag(map, val, regA);
    return createOpTime(2, 8);
  },

  subImmediate: ({ mmu, map }) => {
    const regA = map.a();
    const val = regA - readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setSubtractionFlag(map, val, regA);
    return createOpTime(2, 8);
  },

  sbc: ({ map }, regX) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const regA = map.a();
    const val = regA - regX() - isCarry;
    map.a(val);
    setSubtractionFlag(map, val, regA);
    return createOpTime(1, 4);
  },

  sbcMemHL: ({ mmu, map }) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const regA = map.a();
    const val = regA - readValFromHLMem(map, mmu) - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, regA);
    return createOpTime(2, 8);
  },

  // LOGICAL
  and: ({ map }, regX) => {
    const val = map.a() & regX();
    map.a(val);
    setLogicalAndFlag(map, val);
    return createOpTime(1, 4);
  },

  andMemHL: ({ mmu, map }) => {
    const val = map.a() & readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalAndFlag(map, val);
    return createOpTime(2, 8);
  },

  andImmediate: ({ mmu, map }) => {
    const val = map.a() & readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalAndFlag(map, val);
    return createOpTime(2, 8);
  },

  or: ({ map }, regX) => {
    const val = map.a() | regX();
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(1, 4);
  },

  orMemHL: ({ mmu, map }) => {
    const val = map.a() | readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(2, 8);
  },

  orImmediate: ({ mmu, map }) => {
    const val = map.a() | readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(2, 8);
  },

  xor: ({ map }, regX) => {
    const val = map.a() ^ regX();
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(1, 4);
  },

  xorMemHL: ({ mmu, map }) => {
    const val = map.a() ^ readValFromHLMem(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(2, 8);
  },

  xorImmediate: ({ mmu, map }) => {
    const val = map.a() ^ readImmediateValueAndIncrementPC(map, mmu);
    map.a(val);
    setLogicalOrFlag(map, val);
    return createOpTime(2, 8);
  },
  // Compare reg to A, setting flags (CP reg, B)
  cp: ({ map }, regX) => {
    const res = map.a() - regX();
    setFlagsOnCompare(map, res);
    return createOpTime(1, 4);
  },

  cpMemHL: ({ mmu, map }) => {
    const res = map.a() - readValFromHLMem(map, mmu);
    setFlagsOnCompare(map, res);
    return createOpTime(2, 8);
  },

  cpImmediate: ({ mmu, map }) => {
    const res = map.a() - readImmediateValueAndIncrementPC(map, mmu);
    setFlagsOnCompare(map, res);
    return createOpTime(2, 8);
  },

  inc: (cpu, regX) => {
    alu16.inc(cpu, regX);
    const val = regX();
    setFlagsOnInc(cpu.map, val);
    return createOpTime(1, 4);
  },

  // Seems like the offical manual says to set H if there was a borrow to bit 3.
  dec: (cpu, regX) => {
    alu16.dec(cpu, regX);
    const val = regX();
    setFlagsOnDec(cpu.map, val);
    return createOpTime(1, 4);
  },

  incMemHL: ({ mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr) + 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnInc(map, val);
    return createOpTime(3, 12);
  },

  decMemHL: ({ mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr) - 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnDec(map, val);
    return createOpTime(3, 12);
  },
};

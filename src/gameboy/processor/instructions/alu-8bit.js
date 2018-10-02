import { CheckFlagFor } from '../';
import { createOpTime } from '../clock-util';
import Util from '../../util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

const setSubtractionFlag = (map, val, subtrahend, minuend) => {
  const flag = new CheckFlagFor().zero(val).subtraction()
    .setC(val < 0).setH(val, subtrahend, minuend).get();
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

const setFlagsOnCompare = (map, val, subtrahend, minuend) => {
  const flag = new CheckFlagFor().subtraction().zero(val)
    .setC(val < 0).setH(val, subtrahend, minuend).get();
  map.f(flag);
};

const setFlagsOnInc = (map, val) => {
  const prevFlag = map.f();
  const flag = new CheckFlagFor(prevFlag).zero(val).notSubtraction().setH(val, val - 1, 1).get();
  map.f(flag);
};

const setFlagsOnDec = (map, val) => {
  const prevFlag = map.f();
  // Only way to borrow. -1 each time. From 0001 000 -> 0000 111
  const flag = new CheckFlagFor(prevFlag).zero(val).subtraction().setH(val, val + 1, 1).get();
  map.f(flag);
};

export default {

  // ADDITION
  add: ({ map }, regX) => {
    const a = map.a();
    const x = regX();
    const val = a + x;
    const flag = new CheckFlagFor().zero(val).carry(val).setH(val, a, x).get();
    map.f(flag);
    map.a(val);
    return createOpTime(1, 4);
  },

  addMemHL: ({ mmu, map }) => {
    const valFromMem = readValFromHLMem(map, mmu);
    const a = map.a();
    const sum = valFromMem + a;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).setH(sum, a, valFromMem).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcMemHLPlusCarry: ({ mmu, map }) => {
    const valFromMem = readValFromHLMem(map, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const a = map.a();
    const sum = valFromMem + a + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).setH(sum, a, valFromMem).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcImmediatePlusCarry: ({ mmu, map }) => {
    const immediateValue = readImmediateValueAndIncrementPC(map, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const a = map.a();
    const sum = immediateValue + a + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum)
      .carry(sum).setH(sum, a, immediateValue).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  addImmediate: ({ mmu, map }) => {
    const imVal = readImmediateValueAndIncrementPC(map, mmu);
    const a = map.a();
    const sum = imVal + a;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).setH(sum, a, imVal).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcPlusCarry: ({ map }, regX) => {
    const a = map.a();
    const x = regX();
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = a + x + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).setH(sum, a, x).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  // SUBTRACTION
  sub: ({ map }, regX) => {
    const a = map.a();
    const x = regX();
    const val = a - x;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, x);
    return createOpTime(1, 4);
  },

  subMemHL: ({ mmu, map }) => {
    const a = map.a();
    const b = readValFromHLMem(map, mmu);
    const val = a - b;
    map.a(val);
    setSubtractionFlag(map, val, a, b);
    return createOpTime(2, 8);
  },

  subImmediate: ({ mmu, map }) => {
    const a = map.a();
    const b = readImmediateValueAndIncrementPC(map, mmu);
    const val = a - b;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
    return createOpTime(2, 8);
  },

  sbc: ({ map }, regX) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const a = map.a();
    const x = regX();
    const val = a - x - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, x);
    return createOpTime(1, 4);
  },

  sbcMemHL: ({ mmu, map }) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const a = map.a();
    const b = readValFromHLMem(map, mmu);
    const val = a - b - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
    return createOpTime(2, 8);
  },

  sbcImmediate: ({ mmu, map }) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const a = map.a();
    const b = readImmediateValueAndIncrementPC(map, mmu);
    const val = a - b - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(map, val, a, b);
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
    const a = map.a();
    const x = regX();
    const res = a - x;
    setFlagsOnCompare(map, res, a, x);
    return createOpTime(1, 4);
  },

  cpMemHL: ({ mmu, map }) => {
    const a = map.a();
    const mem = readValFromHLMem(map, mmu);
    const res = a - mem;
    setFlagsOnCompare(map, res, a, mem);
    return createOpTime(2, 8);
  },

  cpImmediate: ({ mmu, map }) => {
    const a = map.a();
    const imm = readImmediateValueAndIncrementPC(map, mmu);
    const res = a - imm;
    setFlagsOnCompare(map, res, a, imm);
    return createOpTime(2, 8);
  },

  inc: (cpu, regX) => {
    regX(regX() + 1);
    setFlagsOnInc(cpu.map, regX());
    return createOpTime(1, 4);
  },

  // Seems like the offical manual says to set H if there was a borrow to bit 3.
  dec: (cpu, regX) => {
    regX(regX() - 1);
    setFlagsOnDec(cpu.map, regX());
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

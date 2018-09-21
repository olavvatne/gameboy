import { CheckFlagFor, RegMap } from '../';
import { alu16 } from './';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

const setSubtractionFlag = (reg, val, minuend) => {
  const flag = new CheckFlagFor().zero(val).subtraction()
    .carryBorrow(val).halfCarryBorrow(val, minuend).get();
  reg.reg(RegMap.f, flag);
};

const readImmediateValueAndIncrementPC = (reg, mmu) => {
  const immediateValue = mmu.readByte(reg.pc());
  reg.incrementPC();
  return immediateValue;
};

const readValFromHLMem = (reg, mmu) => {
  const memAddr = reg.reg(RegMap.hl);
  return mmu.readByte(memAddr);
};

const setLogicalAndFlag = (reg, val) => {
  const flag = new CheckFlagFor().zero(val).halfCarry(0b00010000).get();
  reg.reg(RegMap.f, flag);
};

const setLogicalOrFlag = (reg, val) => {
  const flag = new CheckFlagFor().zero(val).get();
  reg.reg(RegMap.f, flag);
};

const setFlagsOnCompare = (reg, val) => {
  const valInA = reg.reg(RegMap.a);
  const flag = new CheckFlagFor().subtraction().zero(val)
    .underflow(val).halfCarryBorrow(val, valInA).get();
  reg.reg(RegMap.f, flag);
};

const setFlagsOnInc = (reg, val) => {
  const prevFlag = reg.flags();
  const isH = (val & 0x0F) === 0; // inc by one. if lower nibble 0000, a half carry has occured.
  const flag = new CheckFlagFor(prevFlag).zero(val).notSubtraction().setHalfCarry(isH).get();
  reg.reg(RegMap.f, flag);
};

const setFlagsOnDec = (reg, val) => {
  const prevFlag = reg.flags();
  // Only way to borrow. -1 each time. From 0001 000 -> 0000 111
  const isH = (val & 0x0F) === 0x0F;
  const flag = new CheckFlagFor(prevFlag).zero(val).subtraction().setHalfCarry(isH).get();
  reg.reg(RegMap.f, flag);
};

export default {

  // ADDITION
  add: ({ reg, map }, regAddr) => {
    const val = map.a() + reg.reg(regAddr);
    const flag = new CheckFlagFor().zero(val).carry(val).halfCarry(val).get();
    map.f(flag);
    map.a(val);
    return createOpTime(1, 4);
  },

  addMemHL: ({ reg, mmu, map }) => {
    const valFromMem = readValFromHLMem(reg, mmu);
    const sum = valFromMem + map.a();
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcMemHLPlusCarry: ({ reg, mmu, map }) => {
    const valFromMem = readValFromHLMem(reg, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = valFromMem + map.a() + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcImmediatePlusCarry: ({ reg, mmu, map }) => {
    const immediateValue = readImmediateValueAndIncrementPC(reg, mmu);
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const sum = immediateValue + map.a() + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  addImmediate: ({ reg, mmu, map }) => {
    const imVal = readImmediateValueAndIncrementPC(reg, mmu);
    const sum = imVal + map.a();
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);

    return createOpTime(2, 8);
  },

  adcPlusCarry: ({ reg, map }, regAddr) => {
    const val = map.a() + reg.reg(regAddr);
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const sum = val + isCarry;
    map.a(sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    map.f(flag);
    return createOpTime(1, 4);
  },

  // SUBTRACTION
  sub: ({ reg, map }, addr) => {
    const regA = map.a();
    const val = regA - reg.reg(addr);
    map.a(val & 0xFF);
    setSubtractionFlag(reg, val, regA);
    return createOpTime(1, 4);
  },

  subMemHL: ({ reg, mmu, map }) => {
    const regA = map.a();
    const val = regA - readValFromHLMem(reg, mmu);
    map.a(val);
    setSubtractionFlag(reg, val, regA);
    return createOpTime(2, 8);
  },

  subImmediate: ({ reg, mmu, map }) => {
    const regA = map.a();
    const val = regA - readImmediateValueAndIncrementPC(reg, mmu);
    map.a(val);
    setSubtractionFlag(reg, val, regA);
    return createOpTime(2, 8);
  },

  sbc: ({ reg, map }, addr) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const regA = map.a();
    const val = regA - reg.reg(addr) - isCarry;
    map.a(val);
    setSubtractionFlag(reg, val, regA);
    return createOpTime(1, 4);
  },

  sbcMemHL: ({ reg, mmu, map }) => {
    const isCarry = new CheckFlagFor(map.f()).isCarry();
    const regA = map.a();
    const val = regA - readValFromHLMem(reg, mmu) - isCarry;
    map.a(val & 0xFF);
    setSubtractionFlag(reg, val, regA);
    return createOpTime(2, 8);
  },

  // LOGICAL
  and: ({ reg, map }, regAddr) => {
    const val = map.a() & reg.reg(regAddr);
    map.a(val);
    setLogicalAndFlag(reg, val);
    return createOpTime(1, 4);
  },

  andMemHL: ({ reg, mmu, map }) => {
    const val = map.a() & readValFromHLMem(reg, mmu);
    map.a(val);
    setLogicalAndFlag(reg, val);
    return createOpTime(2, 8);
  },

  andImmediate: ({ reg, mmu, map }) => {
    const val = map.a() & readImmediateValueAndIncrementPC(reg, mmu);
    map.a(val);
    setLogicalAndFlag(reg, val);
    return createOpTime(2, 8);
  },

  or: ({ reg, mmu, map }, regAddr) => {
    const val = map.a() | reg.reg(regAddr);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(1, 4);
  },

  orMemHL: ({ reg, mmu, map }) => {
    const val = map.a() | readValFromHLMem(reg, mmu);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  orImmediate: ({ reg, mmu, map }) => {
    const val = map.a() | readImmediateValueAndIncrementPC(reg, mmu);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  xor: ({ reg, mmu, map }, regAddr) => {
    const val = map.a() ^ reg.reg(regAddr);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(1, 4);
  },

  xorMemHL: ({ reg, mmu, map }) => {
    const val = map.a() ^ readValFromHLMem(reg, mmu);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  xorImmediate: ({ reg, mmu, map }) => {
    const val = map.a() ^ readImmediateValueAndIncrementPC(reg, mmu);
    map.a(val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },
  // Compare reg to A, setting flags (CP reg, B)
  cp: ({ reg, map }, regAddr) => {
    const res = map.a() - reg.reg(regAddr);
    setFlagsOnCompare(reg, res);
    return createOpTime(1, 4);
  },

  cpMemHL: ({ reg, mmu, map }) => {
    const res = map.a() - readValFromHLMem(reg, mmu);
    setFlagsOnCompare(reg, res);
    return createOpTime(2, 8);
  },

  cpImmediate: ({ reg, mmu, map }) => {
    const res = map.a() - readImmediateValueAndIncrementPC(reg, mmu);
    setFlagsOnCompare(reg, res);
    return createOpTime(2, 8);
  },

  inc: (cpu, regAddr) => {
    alu16.inc(cpu, regAddr);
    const val = cpu.reg.reg(regAddr);
    setFlagsOnInc(cpu.reg, val);
    return createOpTime(1, 4);
  },

  // Seems like the offical manual says to set H if there was a borrow to bit 3.
  dec: (cpu, regAddr) => {
    alu16.dec(cpu, regAddr);
    const val = cpu.reg.reg(regAddr);
    setFlagsOnDec(cpu.reg, val);
    return createOpTime(1, 4);
  },

  incMemHL: ({ reg, mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr) + 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnInc(reg, val);
    return createOpTime(3, 12);
  },

  decMemHL: ({ reg, mmu, map }) => {
    const memAddr = map.hl();
    const val = mmu.readByte(memAddr) - 1;
    mmu.writeByte(memAddr, val);
    setFlagsOnDec(reg, val);
    return createOpTime(3, 12);
  },
};

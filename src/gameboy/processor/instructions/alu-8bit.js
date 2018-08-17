import { CheckFlagFor, RegMap } from '../';
import { alu16 } from '../instructions';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
const createOpTime = (m, t) => ({ m, t });

const setSubtractionFlag = (reg, val) => {
  // TODO: set H and C if no borrow?
  // TODO: set half carry and carry
  const flag = new CheckFlagFor().zero(val).subtraction().get();
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

export default {

  // ADDITION
  add: ({ reg }, regAddr) => {
    const val = reg.reg(RegMap.a) + reg.reg(regAddr);
    const flag = new CheckFlagFor().zero(val).carry(val).halfCarry(val).get();
    reg.reg(RegMap.f, flag);
    reg.reg(RegMap.a, val);
    return createOpTime(1, 4);
  },

  addMemHL: ({ reg, mmu }) => {
    const valFromMem = readValFromHLMem(reg, mmu);
    const sum = valFromMem + reg.reg(RegMap.a);
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  adcMemHLPlusCarry: ({ reg, mmu }) => {
    const valFromMem = readValFromHLMem(reg, mmu);
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const sum = valFromMem + reg.reg(RegMap.a) + isCarry;
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  adcImmediatePlusCarry: ({ reg, mmu }) => {
    const immediateValue = readImmediateValueAndIncrementPC(reg, mmu);
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const sum = immediateValue + reg.reg(RegMap.a) + isCarry;
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  addImmediate: ({ reg, mmu }) => {
    const imVal = readImmediateValueAndIncrementPC(reg, mmu);
    const sum = imVal + reg.reg(RegMap.a);
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  adcPlusCarry: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(RegMap.a) + reg.reg(regAddr);
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const sum = val + isCarry;
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(1, 4);
  },

  ADDHLn: ({ reg }, addr) => {
    const val = reg.reg(RegMap.hl) + reg.reg(addr);
    reg.reg(RegMap.hl, val);
    return createOpTime(2, 8);
  },

  // SUBTRACTION
  sub: ({ reg }, addr) => {
    const val = reg.reg(RegMap.a) - reg.reg(addr);
    reg.reg(RegMap.a, val);
    setSubtractionFlag(reg, val);
    return createOpTime(1, 4);
  },

  subMemHL: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) - readValFromHLMem(reg, mmu);
    reg.reg(RegMap.a, val);
    setSubtractionFlag(reg, val);
    return createOpTime(2, 8);
  },

  subImmediate: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) - readImmediateValueAndIncrementPC(reg, mmu);
    reg.reg(RegMap.a, val);
    setSubtractionFlag(reg, val);
    return createOpTime(2, 8);
  },

  sbc: ({ reg }, addr) => {
    // TODO: half and carry borrow?
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const val = reg.reg(RegMap.a) - reg.reg(addr) - isCarry;
    reg.reg(RegMap.a, val);
    setSubtractionFlag(reg, val);
    return createOpTime(1, 4);
  },

  sbcMemHL: ({ reg, mmu }) => {
    // TODO: what happens if value subracted from A is bigger. Negative number?
    // TODO: half and carry borrow?
    const isCarry = new CheckFlagFor(reg.flags()).isCarry();
    const val = reg.reg(RegMap.a) - readValFromHLMem(reg, mmu) - isCarry;
    reg.reg(RegMap.a, val);
    setSubtractionFlag(reg, val);
    return createOpTime(2, 8);
  },

  // LOGICAL
  and: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(RegMap.a) & reg.reg(regAddr);
    reg.reg(RegMap.a, val);
    setLogicalAndFlag(reg, val);
    return createOpTime(1, 4);
  },

  andMemHL: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) & readValFromHLMem(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalAndFlag(reg, val);
    return createOpTime(2, 8);
  },

  andImmediate: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) & readImmediateValueAndIncrementPC(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalAndFlag(reg, val);
    return createOpTime(2, 8);
  },

  or: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(RegMap.a) | reg.reg(regAddr);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(1, 4);
  },

  orMemHL: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) | readValFromHLMem(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  orImmediate: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) | readImmediateValueAndIncrementPC(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  xor: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(RegMap.a) ^ reg.reg(regAddr);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(1, 4);
  },

  xorMemHL: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) ^ readValFromHLMem(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },

  xorImmediate: ({ reg, mmu }) => {
    const val = reg.reg(RegMap.a) ^ readImmediateValueAndIncrementPC(reg, mmu);
    reg.reg(RegMap.a, val);
    setLogicalOrFlag(reg, val);
    return createOpTime(2, 8);
  },
  // Compare reg to A, setting flags (CP reg, B)
  cp: ({ reg }, regAddr) => {
    // TODO: borrow stuff
    const temp = reg.reg(RegMap.a) - reg.reg(regAddr);

    const flag = new CheckFlagFor().subtraction().zero(temp).underflow(temp).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(1, 4);
  },

  cpMemHL: ({ reg, mmu }, regAddr) => {
    const temp = reg.reg(RegMap.a) - readValFromHLMem(reg, mmu);

    const flag = new CheckFlagFor().subtraction().zero(temp).underflow(temp).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(2, 8);
  },

  cpImmediate: ({ reg, mmu }, regAddr) => {
    const temp = reg.reg(RegMap.a) - readImmediateValueAndIncrementPC(reg, mmu);

    const flag = new CheckFlagFor().subtraction().zero(temp).underflow(temp).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(2, 8);
  },

  inc: alu16.inc,
  dec: alu16.dec,

  incMemHL: ({ reg, mmu }) => {
    return createOpTime(3, 12);
  }
};

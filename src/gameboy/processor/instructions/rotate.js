import { CheckFlagFor } from '../index.js';
/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const rotateLeftWithMsbAround = (val, map, checkZero) => {
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = ((val << 1) + msb) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

const rotateLeftWithCarryAround = (val, map, checkZero) => {
  const isCarry = new CheckFlagFor(map.f()).isCarry();
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = ((val << 1) + isCarry) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

const rotateRightWithLsbAround = (val, map, checkZero) => {
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = ((val >>> 1) + (lsb << 7)) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

const rotateRightWithCarryAround = (val, map, checkZero) => {
  const isCarry = new CheckFlagFor(map.f()).isCarry();
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  const newVal = ((val >>> 1) + (isCarry << 7)) & 0xFF;
  const newFlag = new CheckFlagFor().setZero(newVal === 0 && checkZero).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

export default {
  rcla: ({ map }) => {
    const val = map.a();
    const newVal = rotateLeftWithMsbAround(val, map, false);
    map.a(newVal);
    return 4;
  },

  rla: ({ map }) => {
    const val = map.a();
    const newVal = rotateLeftWithCarryAround(val, map, false);
    map.a(newVal);

    return 4;
  },

  rrca: ({ map }) => {
    const val = map.a();
    const newVal = rotateRightWithLsbAround(val, map, false);
    map.a(newVal);

    return 4;
  },

  rra: ({ map }) => {
    const val = map.a();
    const newVal = rotateRightWithCarryAround(val, map, false);
    map.a(newVal);

    return 4;
  },

  rlc: ({ map }, regX) => {
    const val = regX();
    const newVal = rotateLeftWithMsbAround(val, map, true);
    regX(newVal);
    return 8;
  },

  rlcMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithMsbAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },

  rl: ({ map }, regX) => {
    const val = regX();
    const newVal = rotateLeftWithCarryAround(val, map, true);
    regX(newVal);
    return 8;
  },

  rlMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateLeftWithCarryAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },

  rrc: ({ map }, regX) => {
    const val = regX();
    const newVal = rotateRightWithLsbAround(val, map, true);
    regX(newVal);
    return 8;
  },

  rrcMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithLsbAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },

  rr: ({ map }, regX) => {
    const val = regX();
    const newVal = rotateRightWithCarryAround(val, map, true);
    regX(newVal);
    return 8;
  },

  rrMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = rotateRightWithCarryAround(val, map, true);
    mmu.writeByte(addr, newVal);
    return 16;
  },
};

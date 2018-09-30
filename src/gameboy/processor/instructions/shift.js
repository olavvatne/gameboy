import { CheckFlagFor } from '../';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const shiftLeft = (val, map) => {
  const msb = (val & 0b10000000) === 0b10000000;
  const newVal = val << 1;
  const newFlag = new CheckFlagFor().zero(newVal).setC(msb).get();
  map.f(newFlag);
  return newVal;
};

const shiftRight = (val, map, keepMsb) => {
  const lsb = val & 0b00000001;
  const isLsb = lsb === 0b00000001;
  let newVal = val >>> 1;
  if (keepMsb) {
    const msbMask = val & 0b10000000;
    newVal |= msbMask;
  }

  const newFlag = new CheckFlagFor().zero(newVal).setC(isLsb).get();
  map.f(newFlag);
  return newVal;
};

export default {
  sla: ({ map }, regX) => {
    const val = regX();
    const newVal = shiftLeft(val, map);
    regX(newVal);
    return createOpTime(2, 8);
  },

  slaMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = shiftLeft(val, map);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  sra: ({ map }, regX) => {
    const val = regX();
    const newVal = shiftRight(val, map, true);
    regX(newVal);
    return createOpTime(2, 8);
  },

  sraMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = shiftRight(val, map, true);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },

  srl: ({ map }, regX) => {
    const val = regX();
    const newVal = shiftRight(val, map);
    regX(newVal);
    return createOpTime(2, 8);
  },

  srlMemHL: ({ mmu, map }) => {
    const addr = map.hl();
    const val = mmu.readByte(addr);
    const newVal = shiftRight(val, map);
    mmu.writeByte(addr, newVal);
    return createOpTime(4, 16);
  },
};

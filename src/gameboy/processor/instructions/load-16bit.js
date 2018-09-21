import { CheckFlagFor, RegMap } from '../';
import Util from './../../util';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  ldImmediateIntoReg: ({ reg, mmu, map }, regAddr) => {
    const pc = map.pc();
    const imAddr = pc;
    map.pc(pc + 2);
    const imVal = mmu.readWord(imAddr);
    reg.reg(regAddr, imVal);
    return createOpTime(3, 12);
  },

  ldRegToReg: ({ reg }, fromReg, toReg) => {
    const val = reg.reg(fromReg);
    reg.reg(toReg, val);
    return createOpTime(2, 8);
  },

  ldHLFromSPPlusImmediate: ({ mmu, map }) => {
    const spVal = map.sp();
    const pc = map.pc();
    const imAddr = pc;
    const imSignedByte = Util.convertSignedByte(mmu.readByte(imAddr));
    map.pc(pc + 1);
    const newVal = spVal + imSignedByte;
    map.hl(spVal + imSignedByte);

    const flag = new CheckFlagFor().carry(newVal).halfCarry(newVal).get();
    map.f(flag);

    return createOpTime(3, 12);
  },

  ldSPIntoImmediate: ({ mmu, map }) => {
    const spVal = map.sp();
    const pc = map.pc();
    const imAddr = pc;
    const imVal = mmu.readWord(imAddr);
    map.pc(pc + 2);
    mmu.writeWord(imVal, spVal);
    return createOpTime(3, 12);
  },

  // Push register pair to the stack (PUSH HL)
  push: ({ reg, mmu, map }, addr) => {
    const sp = map.sp();
    map.sp(sp - 2);
    mmu.writeWord(sp - 2, reg.reg(addr));
    return createOpTime(4, 16);
  },

  // Pop register pair off the stack (POP HL)
  pop: ({ reg, mmu, map }, addr) => {
    const sp = map.sp();
    const regVal = mmu.readWord(sp);
    map.sp(sp + 2);
    reg.reg(addr, regVal);
    return createOpTime(3, 12);
  },

};

import { CheckFlagFor, RegMap } from '../';
import Util from './../../util';
import { createOpTime } from '../clock-util';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  ldImmediateIntoReg: ({ reg, mmu }, regAddr) => {
    const imAddr = reg.pc();
    reg.incrementPC();
    reg.incrementPC();
    const imVal = mmu.readWord(imAddr);
    reg.reg(regAddr, imVal);
    return createOpTime(3, 12);
  },

  ldRegToReg: ({ reg, mmu }, fromReg, toReg) => {
    const val = reg.reg(fromReg);
    reg.reg(toReg, val);
    return createOpTime(2, 8);
  },

  ldHLFromSPPlusImmediate: ({ reg, mmu }) => {
    const spVal = reg.reg(RegMap.sp);
    const imAddr = reg.pc();
    const imSignedByte = Util.convertSignedByte(mmu.readByte(imAddr));
    reg.incrementPC();
    const newVal = spVal + imSignedByte;
    reg.reg(RegMap.hl, spVal + imSignedByte);

    const flag = new CheckFlagFor().carry(newVal).halfCarry(newVal).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(3, 12);
  },

  ldSPIntoImmediate: ({ reg, mmu }) => {
    const spVal = reg.reg(RegMap.sp);
    const imAddr = reg.pc();
    const imVal = mmu.readWord(imAddr);
    reg.incrementPC();
    reg.incrementPC();
    mmu.writeWord(imVal, spVal);
    return createOpTime(3, 12);
  },

  // Push register pair to the stack (PUSH HL)
  push: ({ reg, mmu }, addr) => {
    reg.sp(reg.sp() - 2);
    mmu.writeWord(reg.reg(RegMap.sp), reg.reg(addr));
    return createOpTime(4, 16);
  },

  // Pop register pair off the stack (POP HL)
  pop: ({ reg, mmu }, addr) => {
    const regVal = mmu.readWord(reg.sp());
    reg.sp(reg.sp() + 2);
    reg.reg(addr, regVal);
    return createOpTime(3, 12);
  },

};

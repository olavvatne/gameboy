import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

const createOpTime = (m, t) => ({ m, t });

export default {
  LDImmediateIntoReg: ({ reg, mmu }, regAddr) => {
    const imAddr = reg.pc();
    reg.incrementPC();
    reg.incrementPC();
    const imVal = mmu.readWord(imAddr);
    reg.reg(regAddr, imVal);
    return createOpTime(3, 12);
  },

  LDRegToReg: ({ reg, mmu }, fromReg, toReg) => {
    const val = reg.reg(fromReg);
    reg.reg(toReg, val);
    return createOpTime(2, 8);
  },

  LDHLFromSPPlusImmediate: ({ reg, mmu }) => {
    const spVal = reg.reg(RegMap.sp);
    const imAddr = reg.pc();
    const imVal = mmu.readByte(imAddr);
    reg.incrementPC();
    const newVal = spVal + imVal;
    reg.reg(RegMap.hl, spVal + imVal);

    const flag = new CheckFlagFor().carry(newVal).halfCarry(newVal).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(3, 12);
  },

  LDSPIntoImmediate: ({ reg, mmu }) => {
    const spVal = reg.reg(RegMap.sp);
    const imAddr = reg.pc();
    const imVal = mmu.readWord(imAddr);
    reg.incrementPC();
    reg.incrementPC();
    mmu.writeWord(imVal, spVal);
    return createOpTime(3, 12);
  },

  // Push register pair to the stack (PUSH HL)
  PUSHnn: ({ reg, mmu }, addr) => {
    reg.sp(reg.sp() - 2);
    mmu.writeWord(reg.reg(RegMap.sp), reg.reg(addr));
    return createOpTime(4, 16);
  },

  // Pop register pair off the stack (POP HL)
  POPnn: ({ reg, mmu }, addr) => {
    const regVal = mmu.readWord(reg.sp());
    reg.sp(reg.sp() + 2);
    reg.reg(addr, regVal);
    return createOpTime(3, 12);
  },

};

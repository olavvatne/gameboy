import { CheckFlagFor } from '../index.js';
import Util from './../../util.js';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

export default {
  ldImmediateIntoReg: ({ mmu, map }, regX) => {
    const pc = map.pc();
    const imAddr = pc;
    map.pc(pc + 2);
    const imVal = mmu.readWord(imAddr);
    regX(imVal);
    return 12;
  },

  ldRegToReg: (_, fromReg, toReg) => {
    const val = fromReg();
    toReg(val);
    return 8;
  },

  ldHLFromSPPlusImmediate: ({ mmu, map }) => {
    const spVal = map.sp();
    const pc = map.pc();
    const imSignedByte = Util.convertSignedByte(mmu.readByte(pc));
    map.pc(pc + 1);
    const newVal = spVal + imSignedByte;
    map.hl(newVal);

    const isC = (spVal & 0xFF) + (imSignedByte & 0xFF) > 0xFF;
    const flag = new CheckFlagFor().setC(isC).setH(newVal, spVal, imSignedByte).get();
    map.f(flag);

    return 12;
  },

  ldSPIntoImmediate: ({ mmu, map }) => {
    const spVal = map.sp();
    const pc = map.pc();
    const imAddr = pc;
    const imVal = mmu.readWord(imAddr);
    map.pc(pc + 2);
    mmu.writeWord(imVal, spVal);
    return 20;
  },

  // Push register pair to the stack (PUSH HL)
  push: ({ mmu, map }, regX) => {
    const sp = map.sp();
    map.sp(sp - 2);
    mmu.writeWord(sp - 2, regX());
    return 16;
  },

  // Pop register pair off the stack (POP HL)
  pop: ({ mmu, map }, regX) => {
    const sp = map.sp();
    const regVal = mmu.readWord(sp);
    map.sp(sp + 2);
    regX(regVal);
    return 12;
  },

};

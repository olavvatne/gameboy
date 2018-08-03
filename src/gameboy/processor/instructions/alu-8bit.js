import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
const createOpTime = (m, t) => ({ m, t });

export default {

  ADDAn: ({ reg }, regAddr) => {
    const val = reg.reg(RegMap.a) + reg.reg(regAddr);
    const flag = new CheckFlagFor().zero(val).carry(val).halfCarry(val).get();
    reg.reg(RegMap.f, flag);
    reg.reg(RegMap.a, val);
    return createOpTime(1, 4);
  },

  ADDAMemHL: ({ reg, mmu }) => {
    const memAddr = reg.reg(RegMap.hl);
    const valFromMem = mmu.readByte(memAddr);
    const sum = valFromMem + reg.reg(RegMap.a);
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  ADDAImmediate: ({ reg, mmu }) => {
    const imVal = mmu.readByte(reg.pc());
    reg.incrementPC();

    const sum = imVal + reg.reg(RegMap.a);
    reg.reg(RegMap.a, sum);

    const flag = new CheckFlagFor().zero(sum).carry(sum).halfCarry(sum).get();
    reg.reg(RegMap.f, flag);

    return createOpTime(2, 8);
  },

  ADCAnPlusC: ({ reg, mmu }, regAddr) => {
    const val = reg.reg(RegMap.a) + reg.reg(regAddr);
    const flag = new CheckFlagFor().zero(val).carry(val).halfCarry(val).get();
    reg.reg(RegMap.f, flag);
    reg.reg(RegMap.a, val);
    return createOpTime(1, 4);
  },

  // Add E to A. Leave result in A (ADD A, E)
  ADDr_e: ({ reg }) => {
    let val = reg.reg(RegMap.a) + reg.reg(RegMap.e);

    const flag = new CheckFlagFor().zero(val).carry(val).get();
    val &= 255; // Mask to 8 bit;
    reg.reg(RegMap.f, flag);
    reg.reg(RegMap.a, val);
    return createOpTime(1, 4);
  },

  ADDHLn: ({ reg }, addr) => {
    const val = reg.reg(RegMap.hl) + reg.reg(addr);
    reg.reg(RegMap.hl, val);
    return createOpTime(2, 8);
  },

  // Compare B to A, setting flags (CP A, B)
  CPr_b: ({ reg }) => {
    const temp = reg.reg(RegMap.a) - reg.reg(RegMap.b);

    const flag = new CheckFlagFor().subtraction().zero(temp).underflow(temp).get();
    reg.reg(RegMap.f, flag);
    return createOpTime(1, 4);
  },
};

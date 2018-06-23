import { CheckFlagFor } from './flag-check';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

// Each operation is provided with a snapshot state of the processor
// Each operation return a new object containing only state that has been modified.
// Makes instructions modular and easier to test. Only need to test the state.
const createEmptyNewState = () => ({ clock: {}, reg: {} });

export default {
  // Add E to A. Leave result in A (ADD A, E)
  ADDr_e: ({ clock, reg }) => {
    const ns = createEmptyNewState();
    ns.reg.a = reg.a + reg.e;

    ns.reg.f = new CheckFlagFor().zero(ns.reg.a).carry(ns.reg.a).get();
    if (!(ns.reg.a & 255)) ns.reg.f |= 0x80; // check for zero;
    if (ns.reg.a > 255) ns.reg.f |= 0x10; // check for carry;
    ns.reg.a &= 255; // Mask to 8 bit;

    ns.clock.instructionTime = 1;
    ns.clock.totalTime = clock.totalTime + 4;
    return ns;
  },
  // Compare B to A, setting flags (CP A, B)
  CPr_b: ({ clock, reg }) => {
    const ns = createEmptyNewState();
    const temp = reg.a - reg.b;

    ns.reg.f = new CheckFlagFor().subtraction().zero(temp).underflow(temp).get();
    ns.clock.instructionTime = 1;
    ns.clock.totalTime += 4;
    return ns;
  },
  // No-opration (NOP)
  NOP: ({ clock, reg }) => {
    const ns = createEmptyNewState();

    ns.clock.instructionTime = 1;
    ns.clock.totalTime += 4;
    return ns;
  },
};

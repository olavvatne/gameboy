import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
const createOpTime = (m, t) => ({ m, t });

export default {

  INCnn: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    reg.reg(regAddr, val + 1);
    return createOpTime(2, 8);
  },

  DECnn: ({ reg }, regAddr) => {
    const val = reg.reg(regAddr);
    reg.reg(regAddr, val - 1);
    return createOpTime(2, 8);
  },
};

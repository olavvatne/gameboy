import { CheckFlagFor, RegMap } from '../';

/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */
/* eslint no-param-reassign: 0 */

const createOpTime = (m, t) => ({ m, t });

// TODO:continue here!
export default {
  bit: ({ reg }) => {
    return createOpTime(1, 4);
  },

  set: ({ reg }) => {
    return createOpTime(1, 4);
  },

  res: ({ reg }) => {
    return createOpTime(1, 4);
  },
};

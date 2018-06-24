/* eslint no-bitwise: 0 */
/* eslint no-unused-vars: 0 */
/* eslint newline-per-chained-call: 0 */

const createOpTime = (m, t) => ({ m, t });

export default {
  // No-opration (NOP)
  NOP: cpu => createOpTime(1, 4),
};

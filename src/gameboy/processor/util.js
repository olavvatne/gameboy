/* eslint no-bitwise: 0 */

const Util = {
  convertSignedByte(val) {
    return ((val << 24) >> 24);
  },
  // TODO: start using this one here for all instructions
  createOpTime: (m, t) => ({ m, t }),
};

export default Util;

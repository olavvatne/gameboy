/* eslint no-bitwise: 0 */

const Util = {
  getBit(byte, idx) {
    const mask = 1 << idx;
    return (byte & mask) >>> idx;
  },

};

export default Util;

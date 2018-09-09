/* eslint no-bitwise: 0 */

const Util = {
  convertSignedByte(val) {
    return ((val << 24) >> 24);
  },

  getBit(byte, idx) {
    const mask = 1 << idx;
    return (byte & mask) >>> idx;
  },

  twoComplementByte(val) {
    return ~(val & 0xFF) + 1;
  },
};

export default Util;

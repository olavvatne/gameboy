/* eslint no-bitwise: 0 */

const Util = {
  convertSignedByte(val) {
    return ((val << 24) >> 24);
  },

  getBit(byte, idx) {
    const mask = 1 << idx;
    return (byte & mask) >>> idx;
  },
  // TODO: move to palette?
  // bit 7,6 - 5,4 - 3,2 - 1,0
  getHalfNibble(byte, idx) {
    return (byte >> (idx * 2)) & 0b00000011;
  },

  getPaletteColor(idx) {
    switch (idx) {
      case 0: return [255, 255, 255, 255];
      case 1: return [192, 192, 192, 255];
      case 2: return [96, 96, 96, 255];
      case 3: return [0, 0, 0, 255];
      default: throw new Error('Not a color');
    }
  },

  twoComplementByte(val) {
    return ~(val & 0xFF) + 1;
  },
};

export default Util;

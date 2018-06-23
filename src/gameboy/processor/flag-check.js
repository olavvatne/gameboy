/* eslint no-bitwise: 0 */
export default class CheckFlagFor {
  constructor() {
    this.flag = 0b00000000;
  }

  underflow(reg) {
    if (reg < 0) this.flag |= 0x10;
    return this;
  }

  subtraction() {
    this.flag |= 0x40;
    return this;
  }

  carry(reg) {
    if (reg > 255) this.flag |= 0x10;
    return this;
  }

  zero(reg) {
    if (!(reg & 255)) this.flag |= 0x80;
    return this;
  }

  get() { return this.flag; }
}

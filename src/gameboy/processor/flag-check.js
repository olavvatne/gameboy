/* eslint no-bitwise: 0 */
export default class CheckFlagFor {
  constructor(flag = 0b00000000) {
    this.flag = flag;
  }

  subtraction() {
    this.setSubtraction(true);
    return this;
  }
  notSubtraction() {
    this.setSubtraction(false);
    return this;
  }

  setSubtraction(isSub) {
    if (isSub) this.flag |= 0x40;
    else this.flag &= 0b10111111;
    return this;
  }

  // TODO: depricated
  carry(val) {
    this.setCarry(val > 255);
    return this;
  }

  carry16(val) {
    this.setCarry(val > 0xFFFF);
    return this;
  }

  zero(val) {
    this.setZero(!(val & 255));
    return this;
  }

  setZero(isZero) {
    if (isZero) this.flag |= 0x80;
    else this.flag &= 0b01111111;
    return this;
  }

  setHalfCarry(isHalfCarry) {
    if (isHalfCarry) this.flag |= 0x20;
    else this.flag &= 0b11011111;
    return this;
  }

  // TODO: depricated
  setCarry(isCarry) {
    if (isCarry) this.flag |= 0x10;
    else this.flag &= 0b11101111;
    return this;
  }

  // If carry occured from lower nibble (4 bit of reg) 3.2.2 GBCPUman
  setH(val, a, b) {
    this.setHalfCarry(((val & 0xFF) ^ b ^ a) & 0x10);
    return this;
  }

  setC(isCarry) {
    this.setCarry(isCarry);
    return this;
  }

  setH16(val, a, b) {
    this.setHalfCarry(((val & 0xFFFF) ^ b ^ a) & 0x1000);
    return this;
  }

  get() { return this.flag; }

  isCarry() { return (this.flag & 0b00010000) === 0b00010000; }

  isHalfCarry() { return (this.flag & 0b00100000) === 0b00100000; }

  isZero() { return (this.flag & 0b10000000) === 0b10000000; }

  isSubtraction() { return (this.flag & 0b01000000) === 0b01000000; }
}


/* eslint no-bitwise: 0 */
export default class CheckFlagFor {
  constructor(flag = 0b00000000) {
    this.flag = flag;
  }

  underflow(reg) {
    if (reg < 0) this.flag |= 0x10;
    return this;
  }

  subtraction() {
    this.flag |= 0x40;
    return this;
  }
  notSubtraction() {
    this.flag &= 0b10111111;
    return this;
  }

  carry(reg) {
    if (reg > 255) this.setCarry(true);
    return this;
  }

  carry16(reg) {
    if (reg > 0xFFFF) this.setCarry(true);
    return this;
  }

  zero(reg) {
    if (!(reg & 255)) this.flag |= 0x80;
    return this;
  }

  setHalfCarry(isHalfCarry) {
    if (isHalfCarry) this.flag |= 0x20;
    else this.flag &= 0b11011111;
    return this;
  }

  setCarry(isCarry) {
    if (isCarry) this.flag |= 0x10;
    else this.flag &= 0b11101111;
    return this;
  }

  // If carry occured from lower nibble (4 bit of reg) 3.2.2 GBCPUman
  halfCarry(reg) {
    if (reg > 15) this.setHalfCarry(true);
    return this;
  }

  halfCarry16(reg) {
    if (reg > 0xFFF) this.setHalfCarry(true);
    return this;
  }

  get() { return this.flag; }

  isCarry() { return (this.flag & 0b00010000) === 0b00010000; }

  isHalfCarry() { return (this.flag & 0b00100000) === 0b00100000; }

  isZero() { return (this.flag & 0b10000000) === 0b10000000; }

  isSubtraction() { return (this.flag & 0b01000000) === 0b01000000; }
}


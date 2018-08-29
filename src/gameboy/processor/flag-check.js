/* eslint no-bitwise: 0 */
export default class CheckFlagFor {
  constructor(flag = 0b00000000) {
    this.flag = flag;
  }

  underflow(val) {
    if (val < 0) this.flag |= 0x10;
    return this;
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

  carry(val) {
    if (val > 255) this.setCarry(true);
    return this;
  }

  carry16(val) {
    if (val > 0xFFFF) this.setCarry(true);
    return this;
  }

  zero(val) {
    if (!(val & 255)) this.flag |= 0x80;
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
  halfCarry(val) {
    if ((val & 0x10) === 0x10) this.setHalfCarry(true);
    return this;
  }

  halfCarry16(val) {
    if ((val & 0x1000) === 0x1000) this.setHalfCarry(true);
    return this;
  }

  // If the lower nibble from the subtraction is bigger than the lower nibble from original number,
  //  we see that some kind of borrowing has taken place.
  halfCarryBorrow(resultOfSub, minuend) {
    this.setHalfCarry((minuend & 0x0F) < (resultOfSub & 0x0F));
    return this;
  }

  carryBorrow(resultOfSub) {
    this.setCarry(resultOfSub < 0);
    return this;
  }

  get() { return this.flag; }

  isCarry() { return (this.flag & 0b00010000) === 0b00010000; }

  isHalfCarry() { return (this.flag & 0b00100000) === 0b00100000; }

  isZero() { return (this.flag & 0b10000000) === 0b10000000; }

  isSubtraction() { return (this.flag & 0b01000000) === 0b01000000; }
}


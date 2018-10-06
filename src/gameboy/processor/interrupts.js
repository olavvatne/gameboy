/* eslint no-bitwise: 0 */

export default class Interrupts {
  constructor() {
    this._ie = 0;
    this._if = 0;
    this.enabled = false;
  }

  getInterruptEnabled() {
    return this._ie;
  }

  getInterruptFlags() {
    return this._if;
  }

  anyTriggered() {
    return (this._ie & this._if) !== 0;
  }

  checkVblankTriggered() {
    const isVblank = (this._ie & this._if) & 1;
    if (isVblank) this._if &= 0b11111110;
    return isVblank;
  }

  checkLcdStatTriggered() {
    const lcdStat = (this._ie & this._if) & 2;
    if (lcdStat) this._if &= 0b11111101;
    return lcdStat;
  }

  checkTimerTriggered() {
    const isTimer = (this._ie & this._if) & 4;
    if (isTimer) this._if &= 0b11111011;
    return isTimer;
  }

  triggerTimer() {
    this._if |= 0b00000100;
  }

  checkSerialTriggered() {
    const isSerial = (this._ie & this._if) & 8;
    if (isSerial) this._if &= 0b11110111;
    return isSerial;
  }

  checkJoypadTriggered() {
    const isJoypad = (this._ie & this._if) & 16;
    if (isJoypad) this._if &= 0b11101111;
    return isJoypad;
  }
}

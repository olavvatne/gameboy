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
    if (isVblank) this._if &= ~1 & 0xFF;
    return isVblank;
  }

  checkLcdStatTriggered() {
    const lcdStat = (this._ie & this._if) & 2;
    if (lcdStat) this._if &= ~2 & 0xFF;
    return lcdStat;
  }

  checkTimerTriggered() {
    const isTimer = (this._ie & this._if) & 4;
    if (isTimer) this._if &= ~4 & 0xFF;
    return isTimer;
  }

  checkSerialTriggered() {
    const isSerial = (this._ie & this._if) & 8;
    if (isSerial) this._if &= ~8 & 0xFF;
    return isSerial;
  }

  checkJoypadTriggered() {
    const isJoypad = (this._ie & this._if) & 16;
    if (isJoypad) this._if &= ~16 & 0xFF;
    return isJoypad;
  }
}

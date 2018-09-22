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
    const isVblank = (this._ie & this._if) & 0x01;
    if (isVblank) this._if &= ~0x01 & 0xFF;
    return isVblank;
  }
}

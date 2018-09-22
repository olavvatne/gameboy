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

  getTriggered() {
    return this._ie & this._if;
  }
}

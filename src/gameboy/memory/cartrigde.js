/* eslint no-bitwise: 0 */
export default class Cartridge {
  constructor() {
    this.init();
  }

  init() {
    this.type = 0;
    this.romOffset = 0x4000;
    this.ramOffset = 0x0000;
    this.rom = new Uint8Array(2 ** 15);
    this.ram = new Uint8Array(2 ** 15);
    this.isExternalRam = false;
    this.romBank = 0;
    this.ramBank = 0;
    this.mode = 0;
  }
  enableExternal(val) {
    // Writing value to 0000 - 1FFF a value of 0x0A enabled ext ram
    if (this.type !== 1) return;
    this.isExternalRam = (val & 0x0F) === 0x0A;
  }

  reset() {
    this.init();
  }
}

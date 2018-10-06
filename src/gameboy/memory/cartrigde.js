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

  setRomBank(val) {
    // 4 cartridge types. 1, 2, 3 have MBC1
    // Two upper bits are kept, since it selects rom bank set.
    if (this.type > 0 || this.type < 4) {
      // switch between bank 1-31. 0 treated as 1
      this.romBank &= 0x60;
      let bank = val & 0b00011111;
      if (bank === 0) bank = 1;
      this.romBank |= bank;
      this.romOffset = this.romBank * 0x4000;
    }
  }

  setBankSetAndRamBank(val) {
    if (this.type > 0 || this.type < 4) {
      if (this.mode) {
        this.ramBank = val & 3;
        this.ramOffset = this.ramBank * 0x2000;
      } else {
        this.romBank &= 0x1F;
        this.romBank |= (val & 3) << 5;
        this.romOffset = this.romBank * 0x4000;
      }
    }
  }

  setExpansionMode(val) {
    if (this.type > 0 || this.type < 4) {
      this.mode = val & 1;
    }
  }

  reset() {
    this.init();
  }
}
